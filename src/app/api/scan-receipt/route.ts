import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  uploadReceiptToS3,
  extractTextWithTextract,
  analyzeExpenseWithTextract,
  type TextractExpenseData,
} from "@/lib/aws";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureModelsRegistered, Category, Tag } from "@/lib/models";

// Types for the parsed receipt data
interface ParsedReceiptData {
  merchantName?: string;
  totalAmount?: number;
  date?: string;
  paymentDate?: string;
  category?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  taxAmount?: number;
  subtotal?: number;
}

// Simple OCR-like text extraction (in a real app, you'd use AWS Textract, Google Vision, etc.)
function extractTextFromReceipt(
  text: string,
  availableCategories: string[] = []
): ParsedReceiptData {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const result: ParsedReceiptData = {};

  // Extract merchant name (usually at the top)
  const merchantPatterns = [
    /^([A-Z][A-Z\s&-]{3,30})$/,
    /^([A-Z][a-zA-Z\s&-]{3,30})$/,
  ];

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    for (const pattern of merchantPatterns) {
      const match = lines[i].match(pattern);
      if (match && !match[1].match(/\d/) && match[1].length > 3) {
        result.merchantName = match[1].trim();
        break;
      }
    }
    if (result.merchantName) break;
  }

  // Extract total amount
  const totalPatterns = [
    /(?:total|amount due|balance due|grand total)[:\s]*\$?(\d+\.?\d{0,2})/i,
    /\$(\d+\.\d{2})\s*(?:total|due|balance)/i,
    /(?:^|\s)\$(\d+\.\d{2})(?:\s*total|\s*$)/i,
  ];

  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        if (
          amount > 0 &&
          (!result.totalAmount || amount > result.totalAmount)
        ) {
          result.totalAmount = amount;
        }
      }
    }
  }

  // Extract date
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
    /(\d{4}-\d{1,2}-\d{1,2})/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            result.date = date.toISOString().split("T")[0];
            result.paymentDate = result.date; // Payment date is typically the same as transaction date
            break;
          }
        } catch {
          // Invalid date, continue
        }
      }
    }
    if (result.date) break;
  }

  // Extract tax amount
  const taxPatterns = [
    /(?:tax|hst|gst|pst)[:\s]*\$?(\d+\.?\d{0,2})/i,
    /\$(\d+\.\d{2})\s*(?:tax|hst|gst|pst)/i,
  ];

  for (const line of lines) {
    for (const pattern of taxPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.taxAmount = parseFloat(match[1]);
        break;
      }
    }
    if (result.taxAmount) break;
  }

  // Guess category based on merchant name using available categories
  if (result.merchantName && availableCategories.length > 0) {
    const merchant = result.merchantName.toLowerCase();

    // Try to match with existing categories based on keywords
    let matchedCategory: string | undefined;

    if (
      merchant.includes("restaurant") ||
      merchant.includes("cafe") ||
      merchant.includes("pizza") ||
      merchant.includes("food") ||
      merchant.includes("dining") ||
      merchant.includes("burger") ||
      merchant.includes("coffee") ||
      merchant.includes("starbucks") ||
      merchant.includes("mcdonald")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("travel") ||
          cat.toLowerCase().includes("entertainment") ||
          cat.toLowerCase().includes("food") ||
          cat.toLowerCase().includes("dining")
      );
    } else if (
      merchant.includes("gas") ||
      merchant.includes("fuel") ||
      merchant.includes("shell") ||
      merchant.includes("exxon") ||
      merchant.includes("bp") ||
      merchant.includes("chevron")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("travel") ||
          cat.toLowerCase().includes("transportation") ||
          cat.toLowerCase().includes("fuel")
      );
    } else if (
      merchant.includes("store") ||
      merchant.includes("mart") ||
      merchant.includes("shop") ||
      merchant.includes("target") ||
      merchant.includes("walmart") ||
      merchant.includes("costco")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("office") ||
          cat.toLowerCase().includes("supplies") ||
          cat.toLowerCase().includes("shopping")
      );
    } else if (
      merchant.includes("hotel") ||
      merchant.includes("airline") ||
      merchant.includes("rental") ||
      merchant.includes("uber") ||
      merchant.includes("lyft") ||
      merchant.includes("taxi")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("travel") ||
          cat.toLowerCase().includes("entertainment")
      );
    }

    // Use matched category or default to first available category or "Other"
    result.category =
      matchedCategory ||
      availableCategories.find((cat) => cat.toLowerCase() === "other") ||
      availableCategories[0] ||
      "Other";
  } else {
    result.category = "Other";
  }

  return result;
}

// AWS Textract OCR function
async function performOCR(
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    // Try AWS Textract first
    return await extractTextWithTextract(fileBuffer, contentType);
  } catch (textractError) {
    console.error("AWS Textract failed, using fallback:", textractError);

    // Fallback to placeholder if Textract fails
    const today = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    return `RECEIPT - TEXTRACT UNAVAILABLE
File: ${contentType}
Size: ${Math.round(fileBuffer.length / 1024)} KB
Scanned: ${today} ${time}

NOTICE: AWS Textract is not available.
Please manually verify and enter the following:

Merchant Name: [Please enter merchant name]
Date: ${today}
Amount: $[Please enter total amount]
Tax: $[Please enter tax if applicable]

Error: ${
      textractError instanceof Error ? textractError.message : "Unknown error"
    }

The receipt has been uploaded and is available
for your records.`;
  }
}

// Convert Textract data to our ParsedReceiptData format
function convertTextractToParsedData(
  textractData: TextractExpenseData,
  availableCategories: string[] = []
): ParsedReceiptData {
  const result: ParsedReceiptData = {};

  if (textractData.merchantName) {
    result.merchantName = textractData.merchantName;
  }

  if (textractData.totalAmount && textractData.totalAmount > 0) {
    result.totalAmount = textractData.totalAmount;
  }

  if (textractData.date) {
    try {
      const date = new Date(textractData.date);
      if (!isNaN(date.getTime())) {
        result.date = date.toISOString().split("T")[0];
      }
    } catch {
      result.date = textractData.date;
    }
  }

  if (textractData.taxAmount && textractData.taxAmount > 0) {
    result.taxAmount = textractData.taxAmount;
  }

  if (textractData.subtotal && textractData.subtotal > 0) {
    result.subtotal = textractData.subtotal;
  }

  if (textractData.lineItems && textractData.lineItems.length > 0) {
    result.items = textractData.lineItems.map((item) => ({
      description: item.description,
      amount: item.amount,
      quantity: 1,
    }));
  }

  // Guess category based on merchant name using available categories (same logic as extractTextFromReceipt)
  if (result.merchantName && availableCategories.length > 0) {
    const merchant = result.merchantName.toLowerCase();

    // Try to match with existing categories based on keywords
    let matchedCategory: string | undefined;

    if (
      merchant.includes("restaurant") ||
      merchant.includes("cafe") ||
      merchant.includes("pizza") ||
      merchant.includes("food") ||
      merchant.includes("dining") ||
      merchant.includes("burger") ||
      merchant.includes("coffee") ||
      merchant.includes("starbucks") ||
      merchant.includes("mcdonald")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("travel") ||
          cat.toLowerCase().includes("entertainment") ||
          cat.toLowerCase().includes("food") ||
          cat.toLowerCase().includes("dining")
      );
    } else if (
      merchant.includes("gas") ||
      merchant.includes("fuel") ||
      merchant.includes("shell") ||
      merchant.includes("exxon") ||
      merchant.includes("bp") ||
      merchant.includes("chevron")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("travel") ||
          cat.toLowerCase().includes("transportation") ||
          cat.toLowerCase().includes("fuel")
      );
    } else if (
      merchant.includes("store") ||
      merchant.includes("mart") ||
      merchant.includes("shop") ||
      merchant.includes("target") ||
      merchant.includes("walmart") ||
      merchant.includes("costco")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("office") ||
          cat.toLowerCase().includes("supplies") ||
          cat.toLowerCase().includes("shopping")
      );
    } else if (
      merchant.includes("hotel") ||
      merchant.includes("airline") ||
      merchant.includes("rental") ||
      merchant.includes("uber") ||
      merchant.includes("lyft") ||
      merchant.includes("taxi")
    ) {
      matchedCategory = availableCategories.find(
        (cat) =>
          cat.toLowerCase().includes("travel") ||
          cat.toLowerCase().includes("entertainment")
      );
    }

    // Use matched category or default to first available category or "Other"
    result.category =
      matchedCategory ||
      availableCategories.find((cat) => cat.toLowerCase() === "other") ||
      availableCategories[0] ||
      "Other";
  } else {
    result.category = "Other";
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("receipt") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (images and PDFs)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and PDFs are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (4MB limit for Vercel compatibility)
    const maxSize = 4 * 1024 * 1024; // 4MB (under Vercel's 4.5MB limit)
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            "File too large. Maximum size is 4MB. Please compress your image or use a smaller file.",
          maxSize: "4MB",
          currentSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 413 } // Payload Too Large
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Fetch available categories and tags from database
    await connectToDatabase();
    const [categoriesData, tagsData] = await Promise.all([
      Category.find({ userId: session.user.id }).select("name"),
      Tag.find({ userId: session.user.id }).select("name"),
    ]);

    const availableCategories = categoriesData.map((cat) => cat.name);
    const availableTags = tagsData.map((tag) => tag.name);

    // Upload to S3 first (with robust fallback)
    let uploadResult;
    let uploadSuccess = false;

    try {
      uploadResult = await uploadReceiptToS3(
        buffer,
        file.name,
        file.type,
        session.user.id
      );
      uploadSuccess = true;
      console.log("S3 upload successful:", uploadResult.key);
    } catch (s3Error) {
      console.error("S3 Upload Error:", s3Error);

      // Create a fallback upload result that still allows scanning
      const timestamp = Date.now();
      const fallbackKey = `receipts/${session.user.id}/${timestamp}-${file.name}`;

      uploadResult = {
        key: fallbackKey,
        url: `data:${file.type};base64,${buffer.toString("base64")}`, // Data URL as fallback
        size: buffer.length,
      };

      console.warn("Using fallback data URL due to S3 error");
    }

    // Perform OCR on the image
    const extractedText = await performOCR(buffer, file.type);

    // Try to get structured data from Textract first, then fallback to text parsing
    let parsedData: ParsedReceiptData;
    try {
      const textractData = await analyzeExpenseWithTextract(buffer);
      parsedData = convertTextractToParsedData(
        textractData,
        availableCategories
      );
    } catch (textractError) {
      console.log(
        "Textract expense analysis failed, using text parsing:",
        textractError
      );
      parsedData = extractTextFromReceipt(extractedText, availableCategories);
    }

    return NextResponse.json({
      success: true,
      upload: {
        key: uploadResult.key,
        url: uploadResult.url,
        size: uploadResult.size,
        fileName: file.name,
        contentType: file.type,
        uploaded: uploadSuccess,
        storageType: uploadSuccess ? "s3" : "local_fallback",
      },
      warning: !uploadSuccess
        ? "Receipt processed locally due to storage service issue"
        : undefined,
      extractedText,
      parsedData,
      // Suggest expense data based on parsed receipt
      suggestedExpense: {
        name:
          parsedData.merchantName &&
          parsedData.merchantName !== "[Please enter merchant name]"
            ? `${parsedData.merchantName} - ${parsedData.date || "Receipt"}`
            : `Receipt - ${new Date().toLocaleDateString()}`,
        description: (() => {
          const descriptionParts: string[] = [];

          // Add merchant name if available
          if (
            parsedData.merchantName &&
            parsedData.merchantName !== "[Please enter merchant name]"
          ) {
            descriptionParts.push(`Receipt from ${parsedData.merchantName}`);
          } else {
            descriptionParts.push("Receipt expense");
          }

          // Add date if available
          if (parsedData.date) {
            descriptionParts.push(`Date: ${parsedData.date}`);
          }

          // Add tax amount if available
          if (parsedData.taxAmount && parsedData.taxAmount > 0) {
            descriptionParts.push(`Tax: $${parsedData.taxAmount.toFixed(2)}`);
          }

          // Add subtotal if available and different from total
          if (
            parsedData.subtotal &&
            parsedData.subtotal > 0 &&
            parsedData.totalAmount &&
            Math.abs(parsedData.subtotal - parsedData.totalAmount) > 0.01
          ) {
            descriptionParts.push(
              `Subtotal: $${parsedData.subtotal.toFixed(2)}`
            );
          }

          // Add line items if available (up to 5 items)
          if (parsedData.items && parsedData.items.length > 0) {
            const itemsToShow = parsedData.items.slice(0, 5);
            const itemsText = itemsToShow
              .map(
                (item) => `• ${item.description}: $${item.amount.toFixed(2)}`
              )
              .join("\n");
            descriptionParts.push(`Items:\n${itemsText}`);

            if (parsedData.items.length > 5) {
              descriptionParts.push(
                `... and ${parsedData.items.length - 5} more items`
              );
            }
          }

          return descriptionParts.join("\n");
        })(),
        amount:
          parsedData.totalAmount && parsedData.totalAmount > 0
            ? parsedData.totalAmount
            : 0,
        category: parsedData.category || "Other",
        expenseType: "one-time",
        receiptUrl: uploadResult.url,
        receiptS3Key: uploadResult.key,
        receiptFileName: file.name,
        receiptContentType: file.type,
        paymentDate:
          parsedData.paymentDate ||
          parsedData.date ||
          new Date().toISOString().split("T")[0],
        tags: (() => {
          const suggestedTags: string[] = [];

          // Try to match existing tags with merchant name or category
          if (availableTags.length > 0) {
            const merchantName = parsedData.merchantName?.toLowerCase() || "";
            const category = parsedData.category?.toLowerCase() || "";

            // Find tags that match merchant name or category keywords
            const matchingTags = availableTags.filter((tag) => {
              const tagLower = tag.toLowerCase();
              return (
                merchantName.includes(tagLower) ||
                tagLower.includes(merchantName.split(" ")[0]) ||
                category.includes(tagLower) ||
                tagLower.includes(category.split(" ")[0])
              );
            });

            if (matchingTags.length > 0) {
              suggestedTags.push(...matchingTags.slice(0, 3)); // Limit to 3 tags
            }
          }

          // Fallback to generic tag if no matches found
          if (suggestedTags.length === 0) {
            if (availableTags.includes("receipt")) {
              suggestedTags.push("receipt");
            } else if (availableTags.length > 0) {
              // Use the first available tag as fallback
              suggestedTags.push(availableTags[0]);
            }
          }

          return suggestedTags;
        })(),
      },
    });
  } catch (error) {
    console.error("Error scanning receipt:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to scan receipt";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("S3")) {
        errorMessage =
          "Failed to upload receipt. Please check AWS configuration.";
      } else if (error.message.includes("OCR")) {
        errorMessage = "Failed to process receipt text. Please try again.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "Authentication failed. Please sign in again.";
        statusCode = 401;
      } else if (
        error.message.includes("payload") ||
        error.message.includes("too large") ||
        error.message.includes("413")
      ) {
        errorMessage =
          "File too large for processing. Please compress your image to under 4MB and try again.";
        statusCode = 413;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: statusCode }
    );
  }
}

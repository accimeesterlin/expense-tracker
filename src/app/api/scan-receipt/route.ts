import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadReceiptToS3 } from '@/lib/aws';

// Types for the parsed receipt data
interface ParsedReceiptData {
  merchantName?: string;
  totalAmount?: number;
  date?: string;
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
function extractTextFromReceipt(text: string): ParsedReceiptData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const result: ParsedReceiptData = {};

  // Extract merchant name (usually at the top)
  const merchantPatterns = [
    /^([A-Z][A-Z\s&-]{3,30})$/,
    /^([A-Z][a-zA-Z\s&-]{3,30})$/
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
    /(?:^|\s)\$(\d+\.\d{2})(?:\s*total|\s*$)/i
  ];
  
  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        if (amount > 0 && (!result.totalAmount || amount > result.totalAmount)) {
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
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            result.date = date.toISOString().split('T')[0];
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
    /\$(\d+\.\d{2})\s*(?:tax|hst|gst|pst)/i
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

  // Guess category based on merchant name
  if (result.merchantName) {
    const merchant = result.merchantName.toLowerCase();
    if (merchant.includes('restaurant') || merchant.includes('cafe') || merchant.includes('pizza') || 
        merchant.includes('food') || merchant.includes('dining') || merchant.includes('burger') ||
        merchant.includes('coffee') || merchant.includes('starbucks') || merchant.includes('mcdonald')) {
      result.category = 'Food & Dining';
    } else if (merchant.includes('gas') || merchant.includes('fuel') || merchant.includes('shell') || 
               merchant.includes('exxon') || merchant.includes('bp') || merchant.includes('chevron')) {
      result.category = 'Transportation';
    } else if (merchant.includes('store') || merchant.includes('mart') || merchant.includes('shop') ||
               merchant.includes('target') || merchant.includes('walmart') || merchant.includes('costco')) {
      result.category = 'Shopping';
    } else if (merchant.includes('hotel') || merchant.includes('airline') || merchant.includes('rental') ||
               merchant.includes('uber') || merchant.includes('lyft') || merchant.includes('taxi')) {
      result.category = 'Travel';
    } else {
      result.category = 'Business';
    }
  }

  return result;
}

// Mock OCR function (in production, you'd use a real OCR service)
async function performOCR(_fileBuffer: Buffer, _contentType: string): Promise<string> {
  // This is a mock implementation
  // In a real application, you would integrate with:
  // - AWS Textract
  // - Google Cloud Vision API
  // - Azure Cognitive Services
  // - Tesseract.js (client-side)
  
  // For now, return mock text that demonstrates the parsing
  const mockTexts = [
    `STARBUCKS COFFEE
123 Main Street
City, State 12345

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Venti Latte                 $5.65
Blueberry Muffin           $3.25
                           ------
Subtotal                   $8.90
Tax                        $0.89
                           ------
Total                      $9.79

Thank you for your visit!`,

    `TARGET STORE #1234
456 Shopping Way
City, State 54321

${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

Office Supplies            $24.99
Cleaning Products          $12.50
Groceries                  $45.75
                           ------
Subtotal                   $83.24
Tax (8.25%)                $6.87
                           ------
Total                      $90.11

Thank you for shopping!`,

    `SHELL STATION
789 Highway Rd
City, State 98765

Date: ${new Date().toLocaleDateString()}

Unleaded Gas - 12.5 gal    $47.50
Car Wash                   $8.00
                           ------
Subtotal                   $55.50
Tax                        $4.44
                           ------
Total                      $59.94

Drive safely!`
  ];

  // Return a random mock receipt for demonstration
  return mockTexts[Math.floor(Math.random() * mockTexts.length)];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3 first
    const uploadResult = await uploadReceiptToS3(
      buffer,
      file.name,
      file.type,
      session.user.id
    );

    // Perform OCR on the image
    const extractedText = await performOCR(buffer, file.type);
    
    // Parse the extracted text
    const parsedData = extractTextFromReceipt(extractedText);

    return NextResponse.json({
      success: true,
      upload: {
        key: uploadResult.key,
        url: uploadResult.url,
        size: uploadResult.size,
        fileName: file.name,
        contentType: file.type,
      },
      extractedText,
      parsedData,
      // Suggest expense data based on parsed receipt
      suggestedExpense: {
        name: parsedData.merchantName ? `${parsedData.merchantName} - ${parsedData.date || 'Receipt'}` : 'Receipt Expense',
        description: `Receipt from ${parsedData.merchantName || 'Unknown Merchant'}`,
        amount: parsedData.totalAmount || 0,
        category: parsedData.category || 'Business',
        expenseType: 'business',
        receiptUrl: uploadResult.url,
        receiptS3Key: uploadResult.key,
        receiptFileName: file.name,
        receiptContentType: file.type,
        tags: parsedData.merchantName ? [parsedData.merchantName.toLowerCase().replace(/\s+/g, '-')] : [],
      }
    });
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt' },
      { status: 500 }
    );
  }
}
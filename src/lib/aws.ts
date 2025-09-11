import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TextractClient, DetectDocumentTextCommand, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'expense-tracker-receipts';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export async function uploadReceiptToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string
): Promise<UploadResult> {
  const key = `receipts/${userId}/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: {
      userId: userId,
      originalName: fileName,
      uploadedAt: new Date().toISOString(),
    },
  });

  try {
    await s3Client.send(command);
    
    // Generate a signed URL for accessing the file
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 3600 * 24 * 7 } // 7 days
    );

    return {
      key,
      url: signedUrl,
      size: file.length,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload receipt to S3');
  }
}

export async function deleteReceiptFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete receipt from S3');
  }
}

export async function getSignedReceiptUrl(key: string): Promise<string> {
  try {
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 3600 } // 1 hour
    );
    
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export function parseS3Key(url: string): string | null {
  try {
    // Extract key from S3 URL or return the key if it's already a key
    if (url.includes('amazonaws.com')) {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('.amazonaws.com'));
      return urlParts.slice(bucketIndex + 1).join('/').split('?')[0];
    }
    return url; // Assume it's already a key
  } catch (error) {
    return null;
  }
}

export interface TextractExpenseData {
  merchantName?: string;
  totalAmount?: number;
  date?: string;
  taxAmount?: number;
  subtotal?: number;
  lineItems?: Array<{
    description: string;
    amount: number;
  }>;
}

export async function extractTextWithTextract(fileBuffer: Buffer, contentType: string): Promise<string> {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: fileBuffer,
      },
    });

    const response = await textractClient.send(command);
    
    if (!response.Blocks) {
      throw new Error('No text blocks found in document');
    }

    // Extract text from LINE blocks
    const textLines = response.Blocks
      .filter(block => block.BlockType === 'LINE')
      .map(block => block.Text || '')
      .filter(text => text.length > 0);

    return textLines.join('\n');
  } catch (error) {
    console.error('Textract text extraction failed:', error);
    throw new Error(`Textract text extraction failed: ${error}`);
  }
}

export async function analyzeExpenseWithTextract(fileBuffer: Buffer): Promise<TextractExpenseData> {
  try {
    const command = new AnalyzeExpenseCommand({
      Document: {
        Bytes: fileBuffer,
      },
    });

    const response = await textractClient.send(command);
    
    if (!response.ExpenseDocuments || response.ExpenseDocuments.length === 0) {
      throw new Error('No expense data found in document');
    }

    const expenseDoc = response.ExpenseDocuments[0];
    const result: TextractExpenseData = {};

    // Extract summary fields
    if (expenseDoc.SummaryFields) {
      for (const field of expenseDoc.SummaryFields) {
        const type = field.Type?.Text?.toLowerCase();
        const value = field.ValueDetection?.Text;

        if (!type || !value) continue;

        switch (type) {
          case 'vendor_name':
          case 'merchant_name':
            result.merchantName = value;
            break;
          case 'total':
          case 'amount_paid':
            result.totalAmount = parseFloat(value.replace(/[^0-9.]/g, ''));
            break;
          case 'date':
          case 'invoice_receipt_date':
            result.date = value;
            break;
          case 'tax':
          case 'total_tax':
            result.taxAmount = parseFloat(value.replace(/[^0-9.]/g, ''));
            break;
          case 'subtotal':
            result.subtotal = parseFloat(value.replace(/[^0-9.]/g, ''));
            break;
        }
      }
    }

    // Extract line items
    if (expenseDoc.LineItemGroups) {
      result.lineItems = [];
      for (const group of expenseDoc.LineItemGroups) {
        if (group.LineItems) {
          for (const item of group.LineItems) {
            let description = '';
            let amount = 0;

            if (item.LineItemExpenseFields) {
              for (const field of item.LineItemExpenseFields) {
                const type = field.Type?.Text?.toLowerCase();
                const value = field.ValueDetection?.Text;

                if (!type || !value) continue;

                if (type === 'item' || type === 'description') {
                  description = value;
                } else if (type === 'price' || type === 'amount') {
                  amount = parseFloat(value.replace(/[^0-9.]/g, ''));
                }
              }
            }

            if (description || amount > 0) {
              result.lineItems.push({ description, amount });
            }
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Textract expense analysis failed:', error);
    throw new Error(`Textract expense analysis failed: ${error}`);
  }
}
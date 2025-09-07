import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
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
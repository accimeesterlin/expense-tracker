import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';

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

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if all required environment variables are set
    const requiredVars = {
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json({
        error: 'Missing AWS environment variables',
        missing: missingVars,
        configured: Object.keys(requiredVars).filter(key => requiredVars[key as keyof typeof requiredVars])
      });
    }

    // Test S3 bucket access
    let s3Status = 'SUCCESS';
    let s3Message = 'AWS S3 connection successful';
    let s3Error = null;

    try {
      const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      await s3Client.send(command);
    } catch (error: any) {
      console.error('S3 Error:', error);
      s3Status = 'ERROR';
      s3Message = error.message || 'S3 connection failed';
      s3Error = {
        name: error.name,
        code: error.Code || 'Unknown',
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      };
    }

    // Test Textract access with a minimal test
    let textractStatus = 'SUCCESS';
    let textractMessage = 'AWS Textract service accessible';
    let textractError = null;

    try {
      // Create a simple test image (1x1 white pixel PNG in base64)
      const testImageBytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: testImageBytes,
        },
      });
      
      await textractClient.send(command);
    } catch (error: any) {
      console.error('Textract Error:', error);
      textractStatus = 'ERROR';
      textractMessage = error.message || 'Textract connection failed';
      textractError = {
        name: error.name,
        code: error.Code || 'Unknown',
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      };
    }

    return NextResponse.json({
      status: s3Status === 'SUCCESS' && textractStatus === 'SUCCESS' ? 'SUCCESS' : 'PARTIAL_ERROR',
      services: {
        s3: {
          status: s3Status,
          message: s3Message,
          bucket: BUCKET_NAME,
          error: s3Error
        },
        textract: {
          status: textractStatus,
          message: textractMessage,
          error: textractError
        }
      },
      region: process.env.AWS_REGION,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AWS Test Error:', error);
    return NextResponse.json(
      { 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
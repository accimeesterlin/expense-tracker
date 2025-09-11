import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const awsConfigured = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.AWS_S3_BUCKET_NAME
    );

    const dbConfigured = !!process.env.MONGODB_URI;
    const authConfigured = !!(
      process.env.NEXTAUTH_SECRET &&
      process.env.NEXTAUTH_URL
    );

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      services: {
        aws_s3: awsConfigured ? 'configured' : 'missing_credentials',
        database: dbConfigured ? 'configured' : 'missing_uri',
        auth: authConfigured ? 'configured' : 'missing_secrets',
      },
      environment: {
        node_env: process.env.NODE_ENV,
        aws_region: process.env.AWS_REGION || 'not_set',
        aws_bucket: process.env.AWS_S3_BUCKET_NAME || 'not_set',
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
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
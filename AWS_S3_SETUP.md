# AWS S3 Setup Guide for Receipt Scanning

This guide will help you set up AWS S3 with proper permissions and policies for the receipt scanning functionality in your expense tracker application.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Basic understanding of AWS IAM

## Step 1: Create S3 Bucket

### Using AWS Console:

1. **Sign in to AWS Console** and navigate to S3
2. **Click "Create bucket"**
3. **Configure bucket settings:**
   - **Bucket name:** `expense-tracker-receipts-[your-unique-suffix]` 
     - Example: `expense-tracker-receipts-prod-2024`
     - Must be globally unique
   - **Region:** Choose your preferred region (e.g., `us-east-1`)
   - **Object Ownership:** ACLs disabled (recommended)
   - **Block Public Access:** Keep all boxes checked (recommended for security)
   - **Bucket Versioning:** Enable (optional, helps with data recovery)
   - **Server-side encryption:** Enable with SSE-S3 (recommended)

4. **Click "Create bucket"**

### Using AWS CLI:
```bash
# Replace with your unique bucket name and region
aws s3 mb s3://expense-tracker-receipts-prod-2024 --region us-east-1
```

## Step 2: Create IAM Policy

### Method A: Using AWS Console

1. **Navigate to IAM Console**
2. **Click "Policies" → "Create Policy"**
3. **Select JSON tab** and paste the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowReceiptOperations",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::expense-tracker-receipts-prod-2024/*"
            ]
        },
        {
            "Sid": "AllowBucketOperations",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::expense-tracker-receipts-prod-2024"
            ]
        }
    ]
}
```

4. **Name the policy:** `ExpenseTrackerReceiptsPolicy`
5. **Add description:** Policy for expense tracker receipt upload and management
6. **Click "Create policy"**

### Method B: Using AWS CLI
```bash
# Save the policy to a file first
cat > receipt-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowReceiptOperations",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::expense-tracker-receipts-prod-2024/*"
            ]
        },
        {
            "Sid": "AllowBucketOperations",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::expense-tracker-receipts-prod-2024"
            ]
        }
    ]
}
EOF

# Create the policy
aws iam create-policy \
    --policy-name ExpenseTrackerReceiptsPolicy \
    --policy-document file://receipt-policy.json
```

## Step 3: Create IAM User

### Using AWS Console:

1. **Navigate to IAM → Users**
2. **Click "Create user"**
3. **User details:**
   - **User name:** `expense-tracker-receipts-user`
   - **Provide user access to AWS Management Console:** Uncheck (this is a programmatic user)

4. **Set permissions:**
   - Select "Attach existing policies directly"
   - Search for and select `ExpenseTrackerReceiptsPolicy`

5. **Review and create user**

6. **Create Access Keys:**
   - Click on the created user
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Select "Application running outside AWS"
   - **Save the Access Key ID and Secret Access Key securely**

### Using AWS CLI:
```bash
# Create user
aws iam create-user --user-name expense-tracker-receipts-user

# Attach policy to user (replace with your actual policy ARN)
aws iam attach-user-policy \
    --user-name expense-tracker-receipts-user \
    --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ExpenseTrackerReceiptsPolicy

# Create access key
aws iam create-access-key --user-name expense-tracker-receipts-user
```

## Step 4: Configure CORS Policy (Optional)

If you plan to upload directly from the browser, configure CORS:

1. **Go to your S3 bucket**
2. **Navigate to "Permissions" tab**
3. **Scroll to "Cross-origin resource sharing (CORS)"**
4. **Click "Edit" and add:**

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://your-domain.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

## Step 5: Set Up Environment Variables

Create or update your `.env.local` file:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_S3_BUCKET_NAME=expense-tracker-receipts-prod-2024
```

**⚠️ Security Note:** Never commit these credentials to version control. Use environment variables or AWS IAM roles in production.

## Step 6: Test the Configuration

Create a test script to verify everything works:

```javascript
// test-s3.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testUpload() {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'test/test-file.txt',
      Body: 'This is a test file',
      ContentType: 'text/plain',
    });

    const result = await s3Client.send(command);
    console.log('✅ Upload successful:', result);
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

testUpload();
```

Run the test:
```bash
node test-s3.js
```

## Security Best Practices

### 1. Least Privilege Principle
- Grant only the minimum permissions required
- Use resource-specific ARNs instead of wildcards when possible

### 2. Access Key Security
```bash
# Rotate access keys regularly
aws iam create-access-key --user-name expense-tracker-receipts-user
aws iam delete-access-key --user-name expense-tracker-receipts-user --access-key-id OLD_KEY_ID
```

### 3. Use IAM Roles in Production
For production deployments (EC2, Lambda, ECS), use IAM roles instead of access keys:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

### 4. Enable CloudTrail
Monitor S3 API calls:
```bash
aws cloudtrail create-trail \
    --name expense-tracker-s3-trail \
    --s3-bucket-name your-cloudtrail-bucket
```

### 5. Set Up Lifecycle Policies
Automatically delete old receipts or move to cheaper storage:

```json
{
    "Rules": [
        {
            "ID": "ReceiptLifecycle",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "receipts/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                }
            ],
            "Expiration": {
                "Days": 2555
            }
        }
    ]
}
```

## Monitoring and Alerts

### CloudWatch Metrics
Monitor your bucket usage:
- `BucketSizeBytes`
- `NumberOfObjects`
- Request metrics (GetObject, PutObject)

### Cost Alerts
Set up billing alerts for S3 usage to avoid unexpected charges.

## Troubleshooting

### Common Issues:

1. **Access Denied Error:**
   - Check IAM policy permissions
   - Verify bucket name in policy matches actual bucket
   - Ensure access keys are correct

2. **Bucket Not Found:**
   - Verify bucket name and region
   - Check if bucket exists in the correct AWS account

3. **CORS Issues:**
   - Add your domain to CORS policy
   - Check browser console for CORS errors

4. **Large File Uploads:**
   - Consider using multipart uploads for files > 100MB
   - Implement progress tracking

### Debug Commands:
```bash
# Test AWS credentials
aws sts get-caller-identity

# List buckets
aws s3 ls

# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Test upload
aws s3 cp test-file.txt s3://your-bucket-name/test/
```

## Production Considerations

### 1. Real OCR Integration Options

The current implementation uses mock OCR. For production, consider:

#### AWS Textract (Recommended)
```bash
# Add Textract permissions to your IAM policy
{
    "Effect": "Allow",
    "Action": [
        "textract:DetectDocumentText",
        "textract:AnalyzeDocument"
    ],
    "Resource": "*"
}
```

#### Google Cloud Vision API
```javascript
// Install Google Cloud Vision
npm install @google-cloud/vision

// Usage example
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

const [result] = await client.textDetection({
  image: { content: buffer }
});
```

#### Azure Cognitive Services
```javascript
// Install Azure SDK
npm install @azure/cognitiveservices-computervision

// Usage example
const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const client = new ComputerVisionClient(endpoint, credentials);
```

### 2. Enhanced Security

#### Virus Scanning
```bash
# Add ClamAV Lambda function for file scanning
aws lambda create-function \
    --function-name scan-uploaded-receipts \
    --runtime nodejs18.x \
    --handler index.handler
```

#### Content-based Access Control
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket/*",
            "Condition": {
                "StringEquals": {
                    "s3:x-amz-server-side-encryption": "AES256"
                }
            }
        }
    ]
}
```

### 3. Cost Optimization

#### Intelligent Tiering
```bash
# Enable Intelligent Tiering
aws s3api put-bucket-intelligent-tiering-configuration \
    --bucket your-bucket-name \
    --id EntireBucket \
    --intelligent-tiering-configuration Id=EntireBucket,Status=Enabled
```

#### Request Metrics
```bash
# Enable request metrics for cost tracking
aws s3api put-bucket-metrics-configuration \
    --bucket your-bucket-name \
    --id EntireBucket \
    --metrics-configuration Id=EntireBucket,Status=Enabled
```

## Summary

Your S3 setup should now include:
- ✅ Secure S3 bucket with proper naming
- ✅ IAM policy with least-privilege permissions  
- ✅ Dedicated IAM user for the application
- ✅ Environment variables configured
- ✅ CORS policy for browser uploads
- ✅ Security best practices implemented
- ✅ Production considerations documented

The receipt scanning feature will now have secure, scalable cloud storage for all uploaded receipts with proper access controls and monitoring capabilities.

**Important:** Remember to replace placeholder values (bucket names, account IDs, etc.) with your actual values before using these configurations.
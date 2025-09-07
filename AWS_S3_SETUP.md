# AWS S3 Configuration for Receipt Uploads

This guide will help you configure AWS S3 bucket and IAM permissions for uploading and storing expense receipts.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Basic understanding of AWS S3 and IAM

## Step 1: Create S3 Bucket

1. **Log into AWS Console**
   - Go to [AWS Console](https://aws.amazon.com/console/)
   - Navigate to S3 service

2. **Create a New Bucket**
   - Click "Create bucket"
   - Choose a unique bucket name (e.g., `your-company-expense-receipts`)
   - Select your preferred AWS Region
   - Keep "Block all public access" enabled for security

3. **Configure Bucket Settings**
   - Enable "Bucket Versioning" (recommended)
   - Enable "Server-side encryption" with Amazon S3 managed keys (SSE-S3)
   - Click "Create bucket"

## Step 2: Configure CORS Policy

1. **Navigate to your bucket**
2. **Go to "Permissions" tab**
3. **Scroll to "Cross-origin resource sharing (CORS)"**
4. **Add the following CORS configuration:**

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3002",
            "https://your-domain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-delete-marker",
            "x-amz-id-2",
            "x-amz-request-id",
            "x-amz-server-side-encryption",
            "x-amz-version-id"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

## Step 3: Create IAM User for Programmatic Access

1. **Navigate to IAM service**
2. **Click "Users" → "Add user"**
3. **Configure user:**
   - Username: `expense-tracker-s3-user`
   - Access type: ✅ Programmatic access
   - Click "Next: Permissions"

## Step 4: Create IAM Policy

1. **Click "Attach existing policies directly"**
2. **Click "Create policy"**
3. **Choose "JSON" tab**
4. **Add the following policy** (replace `your-bucket-name` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ListObjectsInBucket",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name"
            ]
        },
        {
            "Sid": "AllowObjectActions",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectVersion",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

5. **Click "Next: Tags" → "Next: Review"**
6. **Name the policy:** `ExpenseTrackerS3Policy`
7. **Click "Create policy"**

## Step 5: Attach Policy to User

1. **Go back to user creation**
2. **Refresh policies and search for:** `ExpenseTrackerS3Policy`
3. **Select the policy and click "Next: Tags"**
4. **Click "Next: Review" → "Create user"**
5. **⚠️ IMPORTANT:** Copy the Access Key ID and Secret Access Key

## Step 6: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Optional: Custom S3 endpoint (for LocalStack or other S3-compatible services)
# AWS_S3_ENDPOINT=http://localhost:4566
```

## Step 7: Test the Configuration

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Try uploading a receipt:**
   - Create a new expense
   - Click "Show advanced options"
   - Upload a receipt image
   - Check if the file appears in your S3 bucket

## Security Best Practices

### 1. Bucket Policies
Consider adding a bucket policy for additional security:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyIncorrectEncryptionHeader",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*",
            "Condition": {
                "StringNotEquals": {
                    "s3:x-amz-server-side-encryption": "AES256"
                }
            }
        },
        {
            "Sid": "DenyUnSecureCommunications",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::your-bucket-name/*",
                "arn:aws:s3:::your-bucket-name"
            ],
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        }
    ]
}
```

### 2. Lifecycle Policies
Set up lifecycle rules to manage costs:

1. **Go to bucket → "Management" tab**
2. **Create lifecycle rule:**
   - Name: `ExpenseReceiptLifecycle`
   - Apply to all objects
   - Transition to IA after 30 days
   - Transition to Glacier after 90 days
   - Delete after 7 years (adjust as needed for compliance)

### 3. Monitoring and Logging

1. **Enable CloudTrail** for API logging
2. **Set up CloudWatch** for monitoring
3. **Configure S3 access logging** if needed

## Troubleshooting

### Common Issues:

1. **"Access Denied" Error:**
   - Check IAM policy permissions
   - Verify bucket name in policy ARN
   - Ensure CORS is configured correctly

2. **"Bucket not found" Error:**
   - Verify bucket name in environment variables
   - Check AWS region configuration
   - Ensure bucket exists in the specified region

3. **Upload timeout:**
   - Check network connectivity
   - Verify file size limits (default: 10MB)
   - Check CORS configuration

### Environment Variables Check:

Create a test file to verify your configuration:

```javascript
// test-s3.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

s3.listBuckets((err, data) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Buckets:', data.Buckets);
  }
});
```

Run: `node test-s3.js`

## Cost Optimization

- **Use appropriate storage classes** (Standard → IA → Glacier)
- **Set up lifecycle policies** for automatic transitions
- **Monitor usage** with AWS Cost Explorer
- **Delete unused objects** regularly
- **Use S3 Transfer Acceleration** only if needed

## Support

If you encounter issues:

1. Check AWS CloudTrail logs
2. Review IAM policy permissions
3. Verify environment variables
4. Test with AWS CLI: `aws s3 ls s3://your-bucket-name`

---

**⚠️ Security Note:** Never commit AWS credentials to version control. Always use environment variables or AWS IAM roles for production deployments.
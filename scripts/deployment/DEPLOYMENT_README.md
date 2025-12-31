# Resume Generator AI - Deployment Guide

## Quick Start

### Full Deployment (Recommended)

**Cross-platform (Node.js):**
```bash
npm run deploy:full
```

**Windows:**
```bash
deploy-full.bat
```

**Linux/Mac:**
```bash
chmod +x deploy-full.sh
./deploy-full.sh
```

This will:
1. Build all Lambda functions
2. Deploy AWS infrastructure
3. Build and deploy frontend
4. Invalidate CloudFront cache

### Partial Deployments

#### Lambda Functions Only
```bash
npm run deploy:lambda    # Cross-platform
deploy-lambda-only.bat   # Windows
```

#### Frontend Only
```bash
npm run deploy:frontend  # Cross-platform
deploy-frontend-only.bat # Windows
```

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js** installed (v18 or higher)
3. **AWS CDK** installed globally: `npm install -g aws-cdk`
4. **Environment variables** set in `.env.production`

## Manual Deployment Steps

If scripts fail, you can deploy manually:

### 1. Build Lambda Functions
```bash
cd lambda/processFile && npm run build && cd ../..
cd lambda/upload && npm run build && cd ../..
cd lambda/generateResume && npm run build && cd ../..
cd lambda/generateCoverLetter && npm run build && cd ../..
```

### 2. Deploy Infrastructure
```bash
cd infrastructure
npx cdk deploy AtsResumeStack-production --require-approval never
cd ..
```

### 3. Build and Deploy Frontend
```bash
npm run build
aws s3 sync out s3://resume-generator-hosting-790756194179-us-east-1 --delete
aws cloudfront create-invalidation --distribution-id E2MF41024ZIBNU --paths "/*"
```

## Testing

Run tests after deployment:
```bash
npm run test:deployment  # Cross-platform
test-deployment.bat      # Windows
```

## URLs

- **Live Site**: https://resume-generator-ai.solutionsynth.cloud
- **Resume Lambda**: https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/
- **Cover Letter Lambda**: https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Lambda Function URLs have correct CORS configuration
2. **API Key Errors**: Verify `ANTHROPIC_API_KEY` is set in environment variables
3. **Build Failures**: Check Node.js version and dependencies
4. **S3 Upload Failures**: Verify AWS credentials and bucket permissions

### Environment Variables Required

```bash
ANTHROPIC_API_KEY=your-key-here
LANGCHAIN_API_KEY=your-key-here
LANGSMITH_API_KEY=your-key-here
```

## Architecture

```
Frontend (S3 + CloudFront)
    ↓
API Gateway (upload, process-file)
    ↓
Lambda Functions (Direct URLs for generation)
    ↓
Anthropic Claude API
```

## Cost Optimization

- Lambda functions use pay-per-request pricing
- S3 and CloudFront have minimal costs for static hosting
- No persistent infrastructure (no EC2, RDS, etc.)
- Estimated cost: $5-20/month depending on usage
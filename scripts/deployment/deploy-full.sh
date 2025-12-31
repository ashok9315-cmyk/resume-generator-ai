#!/bin/bash

echo "========================================"
echo "   Resume Generator AI - Full Deployment"
echo "========================================"
echo

# Set environment variables for deployment
# IMPORTANT: Set these environment variables before running this script:
# export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
# export LANGCHAIN_API_KEY="your-langchain-api-key-here"
# export LANGSMITH_API_KEY="your-langsmith-api-key-here"

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: ANTHROPIC_API_KEY environment variable is not set"
    echo "Please set your API keys before running this script"
    exit 1
fi

# Function to check if command succeeded
check_status() {
    if [ $? -ne 0 ]; then
        echo "ERROR: $1"
        exit 1
    fi
}

echo "Step 1: Building Lambda Functions..."
echo "====================================="

echo "Building processFile Lambda..."
cd lambda/processFile
npm run build
check_status "Failed to build processFile Lambda"
cd ../..

echo "Building upload Lambda..."
cd lambda/upload
npm run build
check_status "Failed to build upload Lambda"
cd ../..

echo "Building generateResume Lambda..."
cd lambda/generateResume
npm run build
check_status "Failed to build generateResume Lambda"
cd ../..

echo "Building generateCoverLetter Lambda..."
cd lambda/generateCoverLetter
npm run build
check_status "Failed to build generateCoverLetter Lambda"
cd ../..

echo
echo "Step 2: Deploying AWS Infrastructure..."
echo "======================================="

cd infrastructure
npx cdk deploy AtsResumeStack-production --require-approval never
check_status "Failed to deploy AWS infrastructure"
cd ..

echo
echo "Step 3: Building Next.js Frontend..."
echo "===================================="

npm run build
check_status "Failed to build Next.js frontend"

echo
echo "Step 4: Deploying to S3..."
echo "=========================="

aws s3 sync out s3://resume-generator-hosting-790756194179-us-east-1 --delete
check_status "Failed to deploy to S3"

echo
echo "Step 5: Invalidating CloudFront Cache..."
echo "========================================"

aws cloudfront create-invalidation --distribution-id E2MF41024ZIBNU --paths "/*"
if [ $? -ne 0 ]; then
    echo "WARNING: Failed to invalidate CloudFront cache (non-critical)"
fi

echo
echo "========================================"
echo "   DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================"
echo
echo "Your application is now live at:"
echo "https://resume-generator-ai.solutionsynth.cloud"
echo
echo "Lambda Function URLs:"
echo "- Resume: https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/"
echo "- Cover Letter: https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/"
echo
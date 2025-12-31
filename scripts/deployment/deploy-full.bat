@echo off
echo ========================================
echo    Resume Generator AI - Full Deployment
echo ========================================
echo.

REM Set environment variables for deployment
REM IMPORTANT: Set these environment variables before running this script:
REM set ANTHROPIC_API_KEY=your-anthropic-api-key-here
REM set LANGCHAIN_API_KEY=your-langchain-api-key-here
REM set LANGSMITH_API_KEY=your-langsmith-api-key-here

if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: ANTHROPIC_API_KEY environment variable is not set
    echo Please set your API keys before running this script
    pause
    exit /b 1
)

echo Step 1: Building Lambda Functions...
echo =====================================

echo Building processFile Lambda...
cd lambda\processFile
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build processFile Lambda
    pause
    exit /b 1
)
cd ..\..

echo Building upload Lambda...
cd lambda\upload
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build upload Lambda
    pause
    exit /b 1
)
cd ..\..

echo Building generateResume Lambda...
cd lambda\generateResume
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build generateResume Lambda
    pause
    exit /b 1
)
cd ..\..

echo Building generateCoverLetter Lambda...
cd lambda\generateCoverLetter
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build generateCoverLetter Lambda
    pause
    exit /b 1
)
cd ..\..

echo.
echo Step 2: Deploying AWS Infrastructure...
echo =======================================

cd infrastructure
call npx cdk deploy AtsResumeStack-production --require-approval never
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy AWS infrastructure
    pause
    exit /b 1
)
cd ..

echo.
echo Step 3: Building Next.js Frontend...
echo ====================================

call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Next.js frontend
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying to S3...
echo ==========================

call aws s3 sync out s3://resume-generator-hosting-790756194179-us-east-1 --delete
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy to S3
    pause
    exit /b 1
)

echo.
echo Step 5: Invalidating CloudFront Cache...
echo ========================================

call aws cloudfront create-invalidation --distribution-id E2MF41024ZIBNU --paths "/*"
if %errorlevel% neq 0 (
    echo WARNING: Failed to invalidate CloudFront cache (non-critical)
)

echo.
echo ========================================
echo    DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Your application is now live at:
echo https://resume-generator-ai.solutionsynth.cloud
echo.
echo Lambda Function URLs:
echo - Resume: https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/
echo - Cover Letter: https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/
echo.
pause
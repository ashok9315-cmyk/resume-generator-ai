@echo off
echo ========================================
echo    Quick Frontend Deployment
echo ========================================
echo.

echo Building Next.js frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo Deploying to S3...
call aws s3 sync out s3://resume-generator-hosting-790756194179-us-east-1 --delete
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy to S3
    pause
    exit /b 1
)

echo Invalidating CloudFront cache...
call aws cloudfront create-invalidation --distribution-id E2MF41024ZIBNU --paths "/*"

echo.
echo Frontend deployment completed!
echo Site: https://resume-generator-ai.solutionsynth.cloud
pause
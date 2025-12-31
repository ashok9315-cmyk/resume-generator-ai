@echo off
echo ========================================
echo    Quick Lambda Deployment
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

echo Building and deploying Lambda functions only...

echo Building processFile Lambda...
cd lambda\processFile && call npm run build && cd ..\..

echo Building upload Lambda...
cd lambda\upload && call npm run build && cd ..\..

echo Building generateResume Lambda...
cd lambda\generateResume && call npm run build && cd ..\..

echo Building generateCoverLetter Lambda...
cd lambda\generateCoverLetter && call npm run build && cd ..\..

echo Deploying to AWS...
cd infrastructure && call npx cdk deploy AtsResumeStack-production --require-approval never && cd ..

echo.
echo Lambda deployment completed!
pause
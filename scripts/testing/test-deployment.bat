@echo off
echo ========================================
echo    Testing Deployment
echo ========================================
echo.

echo Testing Lambda Function URLs...
echo.

echo Testing Resume Generation...
node scripts/testing/test-direct-lambda.js

echo.
echo Testing Cover Letter Generation...
node scripts/testing/test-cover-letter-cleanup.js

echo.
echo Testing Frontend Processing...
node scripts/testing/test-frontend-processing.js

echo.
echo All tests completed!
pause
#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command) {
  try {
    log(`Executing: ${command}`, colors.cyan);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`ERROR: Command failed: ${command}`, colors.red);
    return false;
  }
}

function testUrl(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    let resolved = false;
    
    const req = https.get(url, (res) => {
      if (!resolved) {
        resolved = true;
        log(`✓ ${url} - Status: ${res.statusCode}`, 
            res.statusCode === expectedStatus ? colors.green : colors.red);
        resolve(res.statusCode === expectedStatus);
      }
    });
    
    req.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        log(`✗ ${url} - Error: ${error.message}`, colors.red);
        resolve(false);
      }
    });
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        log(`✗ ${url} - Timeout (5s)`, colors.red);
        req.destroy();
        resolve(false);
      }
    }, 5000);
    
    req.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

function testLambdaFunction(url, testData, name) {
  return new Promise((resolve) => {
    let resolved = false;
    const postData = JSON.stringify(testData);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (!resolved) {
          resolved = true;
          const success = res.statusCode === 200;
          log(`${success ? '✓' : '✗'} ${name} Lambda - Status: ${res.statusCode}`, 
              success ? colors.green : colors.red);
          if (!success) {
            log(`Response: ${data.substring(0, 200)}...`, colors.yellow);
          } else {
            log(`${name} Lambda working correctly`, colors.green);
          }
          resolve(success);
        }
      });
    });
    
    req.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        log(`✗ ${name} Lambda - Error: ${error.message}`, colors.red);
        resolve(false);
      }
    });
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        log(`✗ ${name} Lambda - Timeout (30s)`, colors.red);
        req.destroy();
        resolve(false);
      }
    }, 30000);
    
    req.on('close', () => {
      clearTimeout(timeout);
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  log('========================================', colors.bright);
  log('   Resume Generator AI - Deployment Test', colors.bright);
  log('========================================', colors.bright);
  log('');

  let allTestsPassed = true;

  // Test 1: Frontend Website
  log('Test 1: Frontend Website', colors.yellow);
  log('========================', colors.yellow);
  
  const frontendUrls = [
    'https://resume-generator-ai.solutionsynth.cloud',
    'https://resume-generator-ai.solutionsynth.cloud/resume',
    'https://resume-generator-ai.solutionsynth.cloud/cover-letter'
  ];

  for (const url of frontendUrls) {
    const result = await testUrl(url);
    if (!result) allTestsPassed = false;
  }

  // Add a small delay to ensure all connections are closed
  await new Promise(resolve => setTimeout(resolve, 1000));

  log('');
  log('Test 2: Lambda Function URLs', colors.yellow);
  log('============================', colors.yellow);

  // Test Resume Lambda
  const resumeTestData = {
    text: "John Doe\nSoftware Engineer\nExperience: 5 years in web development",
    jobDescription: "Looking for a senior software engineer with React experience"
  };

  const resumeResult = await testLambdaFunction(
    'https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/',
    resumeTestData,
    'Resume'
  );
  if (!resumeResult) allTestsPassed = false;

  // Test Cover Letter Lambda
  const coverLetterTestData = {
    resumeText: "John Doe\nSoftware Engineer\nExperience: 5 years in web development",
    jobDescription: "Looking for a senior software engineer with React experience",
    companyName: "Tech Corp"
  };

  const coverLetterResult = await testLambdaFunction(
    'https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/',
    coverLetterTestData,
    'Cover Letter'
  );
  if (!coverLetterResult) allTestsPassed = false;

  log('');
  log('Test 3: AWS Services Health Check', colors.yellow);
  log('=================================', colors.yellow);

  // Test AWS CLI access
  const awsCommands = [
    'aws sts get-caller-identity',
    'aws s3 ls s3://resume-generator-hosting-790756194179-us-east-1',
    'aws cloudfront get-distribution --id E2MF41024ZIBNU --query "Distribution.Status"'
  ];

  for (const command of awsCommands) {
    const result = execCommand(command);
    if (!result) allTestsPassed = false;
  }

  log('');
  log('========================================', colors.bright);
  if (allTestsPassed) {
    log('   ALL TESTS PASSED! ✓', colors.green);
    log('   Deployment is healthy and ready for use.', colors.green);
  } else {
    log('   SOME TESTS FAILED! ✗', colors.red);
    log('   Please check the errors above and redeploy if needed.', colors.red);
  }
  log('========================================', colors.bright);
  log('');

  process.exit(allTestsPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}
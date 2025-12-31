#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

function execCommand(command, cwd = process.cwd()) {
  try {
    log(`Executing: ${command}`, colors.cyan);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY || '',
        LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY || ''
      }
    });
    return true;
  } catch (error) {
    log(`ERROR: Command failed: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

function main() {
  log('========================================', colors.bright);
  log('   Resume Generator AI - Full Deployment', colors.bright);
  log('========================================', colors.bright);
  log('');

  const rootDir = path.resolve(__dirname, '../..');
  
  // Step 1: Build Lambda Functions
  log('Step 1: Building Lambda Functions...', colors.yellow);
  log('=====================================', colors.yellow);

  const lambdaFunctions = ['processFile', 'upload', 'generateResume', 'generateCoverLetter'];
  
  for (const func of lambdaFunctions) {
    log(`Building ${func} Lambda...`, colors.blue);
    const lambdaDir = path.join(rootDir, 'lambda', func);
    
    if (!fs.existsSync(lambdaDir)) {
      log(`WARNING: Lambda function ${func} directory not found, skipping...`, colors.yellow);
      continue;
    }
    
    if (!execCommand('npm run build', lambdaDir)) {
      log(`ERROR: Failed to build ${func} Lambda`, colors.red);
      process.exit(1);
    }
  }

  log('');
  log('Step 2: Deploying AWS Infrastructure...', colors.yellow);
  log('=======================================', colors.yellow);

  const infraDir = path.join(rootDir, 'infrastructure');
  if (!execCommand('npx cdk deploy AtsResumeStack-production --require-approval never', infraDir)) {
    log('ERROR: Failed to deploy AWS infrastructure', colors.red);
    process.exit(1);
  }

  log('');
  log('Step 3: Building Next.js Frontend...', colors.yellow);
  log('====================================', colors.yellow);

  if (!execCommand('npm run build', rootDir)) {
    log('ERROR: Failed to build Next.js frontend', colors.red);
    process.exit(1);
  }

  log('');
  log('Step 4: Deploying to S3...', colors.yellow);
  log('==========================', colors.yellow);

  if (!execCommand('aws s3 sync out s3://resume-generator-hosting-790756194179-us-east-1 --delete', rootDir)) {
    log('ERROR: Failed to deploy to S3', colors.red);
    process.exit(1);
  }

  log('');
  log('Step 5: Invalidating CloudFront Cache...', colors.yellow);
  log('========================================', colors.yellow);

  if (!execCommand('aws cloudfront create-invalidation --distribution-id E2MF41024ZIBNU --paths "/*"', rootDir)) {
    log('WARNING: Failed to invalidate CloudFront cache (non-critical)', colors.yellow);
  }

  log('');
  log('========================================', colors.green);
  log('   DEPLOYMENT COMPLETED SUCCESSFULLY!', colors.green);
  log('========================================', colors.green);
  log('');
  log('Your application is now live at:', colors.bright);
  log('https://resume-generator-ai.solutionsynth.cloud', colors.cyan);
  log('');
  log('Lambda Function URLs:', colors.bright);
  log('- Resume: https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/', colors.cyan);
  log('- Cover Letter: https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/', colors.cyan);
  log('');
}

if (require.main === module) {
  main();
}

module.exports = { execCommand, log, colors };
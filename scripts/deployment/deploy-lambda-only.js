#!/usr/bin/env node

const { execCommand, log, colors } = require('./deploy-full.js');
const path = require('path');
const fs = require('fs');

function main() {
  log('========================================', colors.bright);
  log('   Resume Generator AI - Lambda Deployment', colors.bright);
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
  log('Step 2: Deploying Lambda Functions...', colors.yellow);
  log('=====================================', colors.yellow);

  const infraDir = path.join(rootDir, 'infrastructure');
  if (!execCommand('npx cdk deploy AtsResumeStack-production --require-approval never', infraDir)) {
    log('ERROR: Failed to deploy Lambda functions', colors.red);
    process.exit(1);
  }

  log('');
  log('========================================', colors.green);
  log('   LAMBDA DEPLOYMENT COMPLETED!', colors.green);
  log('========================================', colors.green);
  log('');
  log('Lambda Function URLs:', colors.bright);
  log('- Resume: https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/', colors.cyan);
  log('- Cover Letter: https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/', colors.cyan);
  log('');
}

if (require.main === module) {
  main();
}
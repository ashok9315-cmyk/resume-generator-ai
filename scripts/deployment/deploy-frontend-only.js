#!/usr/bin/env node

const { execCommand, log, colors } = require('./deploy-full.js');
const path = require('path');

function main() {
  log('========================================', colors.bright);
  log('   Resume Generator AI - Frontend Deployment', colors.bright);
  log('========================================', colors.bright);
  log('');

  const rootDir = path.resolve(__dirname, '../..');

  log('Step 1: Building Next.js Frontend...', colors.yellow);
  log('====================================', colors.yellow);

  if (!execCommand('npm run build', rootDir)) {
    log('ERROR: Failed to build Next.js frontend', colors.red);
    process.exit(1);
  }

  log('');
  log('Step 2: Deploying to S3...', colors.yellow);
  log('==========================', colors.yellow);

  if (!execCommand('aws s3 sync out s3://resume-generator-hosting-790756194179-us-east-1 --delete', rootDir)) {
    log('ERROR: Failed to deploy to S3', colors.red);
    process.exit(1);
  }

  log('');
  log('Step 3: Invalidating CloudFront Cache...', colors.yellow);
  log('========================================', colors.yellow);

  if (!execCommand('aws cloudfront create-invalidation --distribution-id E2MF41024ZIBNU --paths "/*"', rootDir)) {
    log('WARNING: Failed to invalidate CloudFront cache (non-critical)', colors.yellow);
  }

  log('');
  log('========================================', colors.green);
  log('   FRONTEND DEPLOYMENT COMPLETED!', colors.green);
  log('========================================', colors.green);
  log('');
  log('Your application is now live at:', colors.bright);
  log('https://resume-generator-ai.solutionsynth.cloud', colors.cyan);
  log('');
}

if (require.main === module) {
  main();
}
#!/usr/bin/env node

const { log, colors } = require('../deployment/deploy-full.js');
const https = require('https');

function testResumeGeneration() {
  return new Promise((resolve) => {
    const testData = JSON.stringify({
      text: "John Doe\nSoftware Engineer\n5 years experience in React, Node.js, and AWS\nBuilt scalable web applications serving 100k+ users",
      jobDescription: "Senior Full Stack Developer position requiring React, Node.js, and cloud experience. Must have experience with scalable applications."
    });

    const options = {
      hostname: 'rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success && response.html) {
            log('✓ Resume generation test passed', colors.green);
            log(`  Generated HTML length: ${response.html.length} characters`, colors.cyan);
            resolve(true);
          } else {
            log('✗ Resume generation test failed', colors.red);
            log(`  Status: ${res.statusCode}, Response: ${data.substring(0, 200)}...`, colors.yellow);
            resolve(false);
          }
        } catch (error) {
          log('✗ Resume generation test failed - Invalid JSON response', colors.red);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`✗ Resume generation test failed - ${error.message}`, colors.red);
      resolve(false);
    });

    req.setTimeout(60000, () => {
      log('✗ Resume generation test failed - Timeout (60s)', colors.red);
      req.destroy();
      resolve(false);
    });

    req.write(testData);
    req.end();
  });
}

function testCoverLetterGeneration() {
  return new Promise((resolve) => {
    const testData = JSON.stringify({
      resumeText: "John Doe\nSoftware Engineer\n5 years experience in React, Node.js, and AWS\nBuilt scalable web applications serving 100k+ users",
      jobDescription: "Senior Full Stack Developer position requiring React, Node.js, and cloud experience. Must have experience with scalable applications.",
      companyName: "TechCorp Inc"
    });

    const options = {
      hostname: 'exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success && response.html) {
            log('✓ Cover letter generation test passed', colors.green);
            log(`  Generated HTML length: ${response.html.length} characters`, colors.cyan);
            resolve(true);
          } else {
            log('✗ Cover letter generation test failed', colors.red);
            log(`  Status: ${res.statusCode}, Response: ${data.substring(0, 200)}...`, colors.yellow);
            resolve(false);
          }
        } catch (error) {
          log('✗ Cover letter generation test failed - Invalid JSON response', colors.red);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`✗ Cover letter generation test failed - ${error.message}`, colors.red);
      resolve(false);
    });

    req.setTimeout(60000, () => {
      log('✗ Cover letter generation test failed - Timeout (60s)', colors.red);
      req.destroy();
      resolve(false);
    });

    req.write(testData);
    req.end();
  });
}

async function main() {
  log('========================================', colors.bright);
  log('   Resume Generator AI - End-to-End Test', colors.bright);
  log('========================================', colors.bright);
  log('');

  log('Testing AI-powered resume and cover letter generation...', colors.yellow);
  log('This may take 30-60 seconds per test due to AI processing.', colors.yellow);
  log('');

  let allTestsPassed = true;

  // Test Resume Generation
  log('Test 1: Resume Generation with AI', colors.yellow);
  log('=================================', colors.yellow);
  const resumeResult = await testResumeGeneration();
  if (!resumeResult) allTestsPassed = false;

  log('');

  // Test Cover Letter Generation
  log('Test 2: Cover Letter Generation with AI', colors.yellow);
  log('=======================================', colors.yellow);
  const coverLetterResult = await testCoverLetterGeneration();
  if (!coverLetterResult) allTestsPassed = false;

  log('');
  log('========================================', colors.bright);
  if (allTestsPassed) {
    log('   ALL END-TO-END TESTS PASSED! ✓', colors.green);
    log('   AI generation is working correctly.', colors.green);
  } else {
    log('   SOME TESTS FAILED! ✗', colors.red);
    log('   Check Lambda logs for AI API issues.', colors.red);
  }
  log('========================================', colors.bright);
  log('');

  process.exit(allTestsPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}
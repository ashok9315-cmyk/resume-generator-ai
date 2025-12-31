#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AtsStack } from "../lib/ats-stack";
import { MonitoringStack } from "../lib/monitoring-stack";
import { LoggingStack } from "../lib/logging-stack";
import { CloudFrontHostingStack } from "../lib/cloudfront-hosting-stack";

const app = new cdk.App();

const env = app.node.tryGetContext("env") || "production";
const region = process.env.AWS_REGION || "us-east-1";

// Main infrastructure stack
const atsStack = new AtsStack(app, `AtsResumeStack-${env}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  description: "ATS Resume Builder - Main infrastructure",
});

// Monitoring stack
const monitoringStack = new MonitoringStack(
  app,
  `AtsResumeMonitoringStack-${env}`,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
    description: "ATS Resume Builder - Monitoring and dashboards",
  }
);

// Logging stack
const loggingStack = new LoggingStack(app, `AtsResumeLoggingStack-${env}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  description: "ATS Resume Builder - Logging and alarms",
});

// CloudFront hosting stack for custom domain
const hostingStack = new CloudFrontHostingStack(app, `AtsResumeHostingStack-${env}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", // CloudFront certificates must be in us-east-1
  },
  domainName: "resume-generator-ai.solutionsynth.cloud",
  hostedZoneId: process.env.HOSTED_ZONE_ID || "", // You'll need to provide this
  description: "ATS Resume Builder - CloudFront hosting with custom domain",
});

// Add dependencies
monitoringStack.addDependency(atsStack);
loggingStack.addDependency(atsStack);
hostingStack.addDependency(atsStack);

app.synth();



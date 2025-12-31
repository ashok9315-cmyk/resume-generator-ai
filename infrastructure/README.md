# AWS CDK Infrastructure

This directory contains the AWS CDK code for deploying the ATS Resume Builder infrastructure.

## Prerequisites

- AWS CLI configured with credentials
- Node.js 20.x
- AWS CDK CLI installed: `npm install -g aws-cdk`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

## Deployment

### Deploy All Stacks

```bash
cdk deploy --all
```

### Deploy Specific Stack

```bash
cdk deploy AtsResumeStack-production
```

### Environment Variables

Set these environment variables before deployment:

```bash
export ANTHROPIC_API_KEY=your-key
export LANGCHAIN_API_KEY=your-key
export LANGSMITH_API_KEY=your-key
```

## Stacks

- **AtsStack**: Main infrastructure (S3, Lambda, API Gateway)
- **MonitoringStack**: CloudWatch dashboards
- **LoggingStack**: Log groups and alarms

## Useful Commands

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes and compile
- `cdk synth` - Synthesize CloudFormation template
- `cdk diff` - Compare deployed stack with current state
- `cdk deploy` - Deploy this stack to your default AWS account/region
- `cdk destroy` - Destroy the stack



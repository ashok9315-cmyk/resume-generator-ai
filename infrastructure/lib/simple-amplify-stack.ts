import * as cdk from "aws-cdk-lib";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface SimpleAmplifyStackProps extends cdk.StackProps {
  domainName: string; // resume-generator-ai.solutionsynth.cloud
  hostedZoneId: string; // Your Route53 hosted zone ID for solutionsynth.cloud
}

export class SimpleAmplifyStack extends cdk.Stack {
  public readonly amplifyApp: cdk.CfnResource;
  public readonly certificate: certificatemanager.Certificate;

  constructor(scope: Construct, id: string, props: SimpleAmplifyStackProps) {
    super(scope, id, props);

    // Look up the existing hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: props.hostedZoneId,
      zoneName: "solutionsynth.cloud",
    });

    // Create SSL certificate for the subdomain
    this.certificate = new certificatemanager.Certificate(this, "Certificate", {
      domainName: props.domainName,
      validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    });

    // Create Amplify Service Role
    const amplifyRole = new iam.Role(this, "AmplifyRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess-Amplify"),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
              ],
              resources: [
                "arn:aws:s3:::ats-resume-uploads-790756194179-us-east-1",
                "arn:aws:s3:::ats-resume-uploads-790756194179-us-east-1/*",
                "arn:aws:s3:::ats-resume-static-790756194179-us-east-1",
                "arn:aws:s3:::ats-resume-static-790756194179-us-east-1/*",
              ],
            }),
          ],
        }),
      },
    });

    // Create Amplify App using CloudFormation
    this.amplifyApp = new cdk.CfnResource(this, "AmplifyApp", {
      type: "AWS::Amplify::App",
      properties: {
        Name: "ats-resume-builder",
        Description: "ATS Resume Builder - Professional resume and cover letter generator",
        Platform: "WEB_COMPUTE",
        IAMServiceRole: amplifyRole.roleArn,
        BuildSpec: `version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*`,
        EnvironmentVariables: [
          { Name: "ANTHROPIC_API_KEY", Value: process.env.ANTHROPIC_API_KEY || "" },
          { Name: "LANGCHAIN_TRACING_V2", Value: "true" },
          { Name: "LANGCHAIN_API_KEY", Value: process.env.LANGCHAIN_API_KEY || "" },
          { Name: "LANGCHAIN_PROJECT", Value: "ats-resume-builder" },
          { Name: "LANGSMITH_API_KEY", Value: process.env.LANGSMITH_API_KEY || "" },
          { Name: "REGION", Value: "us-east-1" },
          { Name: "S3_UPLOAD_BUCKET", Value: "ats-resume-uploads-790756194179-us-east-1" },
          { Name: "S3_STATIC_BUCKET", Value: "ats-resume-static-790756194179-us-east-1" },
          { Name: "API_GATEWAY_URL", Value: "https://nkxintctea.execute-api.us-east-1.amazonaws.com/prod" },
          { Name: "XRAY_TRACING_NAME", Value: "ats-resume-builder" },
          { Name: "RESUME_FUNCTION_URL", Value: "https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/" },
          { Name: "COVER_LETTER_FUNCTION_URL", Value: "https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/" },
          { Name: "NEXT_PUBLIC_APP_URL", Value: `https://${props.domainName}` },
          { Name: "NODE_ENV", Value: "production" },
          { Name: "LOG_LEVEL", Value: "info" },
          { Name: "USE_MOCK_DATA", Value: "false" },
          { Name: "CLOUDWATCH_LOG_GROUP", Value: "/ats-resume/application-logs" },
          { Name: "CLOUDWATCH_LOG_STREAM", Value: "production" },
          { Name: "ENABLE_XRAY_TRACING", Value: "true" },
          { Name: "ENABLE_LANGSMITH_TRACING", Value: "true" },
          { Name: "ENABLE_DEBUG_LOGGING", Value: "false" },
          { Name: "LOG_SAMPLE_RATE", Value: "0.1" },
          { Name: "AMPLIFY_MONOREPO_APP_ROOT", Value: "." },
          { Name: "AMPLIFY_DIFF_DEPLOY", Value: "false" },
          { Name: "_LIVE_UPDATES", Value: '[{"name":"Next.js version","pkg":"next","type":"npm","version_run":"npx next --version"}]' },
        ],
        CustomRules: [
          {
            Source: "/<*>",
            Target: "/index.html",
            Status: "404-200",
          },
          {
            Source: "/api/<*>",
            Target: "https://nkxintctea.execute-api.us-east-1.amazonaws.com/prod/api/<*>",
            Status: "302",
          },
        ],
      },
    });

    // Create main branch
    const mainBranch = new cdk.CfnResource(this, "AmplifyBranch", {
      type: "AWS::Amplify::Branch",
      properties: {
        AppId: this.amplifyApp.getAtt("AppId"),
        BranchName: "main",
        Description: "Main production branch",
        EnableAutoBuild: true,
        EnablePullRequestPreview: true,
      },
    });

    // Create custom domain
    const domain = new cdk.CfnResource(this, "AmplifyDomain", {
      type: "AWS::Amplify::Domain",
      properties: {
        AppId: this.amplifyApp.getAtt("AppId"),
        DomainName: props.domainName,
        SubDomainSettings: [
          {
            BranchName: "main",
            Prefix: "",
          },
        ],
        AutoSubDomainCreationPatterns: ["*", "pr*"],
        AutoSubDomainIAMRole: amplifyRole.roleArn,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: this.amplifyApp.getAtt("AppId").toString(),
      description: "Amplify App ID",
    });

    new cdk.CfnOutput(this, "AmplifyAppUrl", {
      value: `https://${this.amplifyApp.getAtt("AppId")}.amplifyapp.com`,
      description: "Default Amplify App URL",
    });

    new cdk.CfnOutput(this, "CustomDomainName", {
      value: props.domainName,
      description: "Custom Domain Name",
    });

    new cdk.CfnOutput(this, "CustomDomainUrl", {
      value: `https://${props.domainName}`,
      description: "Custom Domain URL",
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: this.certificate.certificateArn,
      description: "SSL Certificate ARN",
    });

    new cdk.CfnOutput(this, "AmplifyConsoleUrl", {
      value: `https://console.aws.amazon.com/amplify/home?region=${this.region}#/${this.amplifyApp.getAtt("AppId")}`,
      description: "Amplify Console URL",
    });
  }
}
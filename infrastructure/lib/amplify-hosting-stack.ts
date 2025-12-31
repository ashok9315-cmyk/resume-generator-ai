import * as cdk from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface AmplifyHostingStackProps extends cdk.StackProps {
  domainName: string; // resume-generator-ai.solutionsynth.cloud
  hostedZoneId: string; // Your Route53 hosted zone ID for solutionsynth.cloud
  githubRepo?: string; // Optional: GitHub repository URL
  githubBranch?: string; // Optional: GitHub branch (default: main)
}

export class AmplifyHostingStack extends cdk.Stack {
  public readonly amplifyApp: amplify.App;
  public readonly certificate: certificatemanager.Certificate;

  constructor(scope: Construct, id: string, props: AmplifyHostingStackProps) {
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

    // Create Amplify App
    this.amplifyApp = new amplify.App(this, "AmplifyApp", {
      appName: "ats-resume-builder",
      description: "ATS Resume Builder - Professional resume and cover letter generator",
      
      // Build settings for Next.js
      buildSpec: amplify.BuildSpec.fromObjectToYaml({
        version: "1.0",
        applications: [
          {
            frontend: {
              phases: {
                preBuild: {
                  commands: [
                    "npm ci",
                  ],
                },
                build: {
                  commands: [
                    "npm run build",
                  ],
                },
              },
              artifacts: {
                baseDirectory: ".next",
                files: ["**/*"],
              },
              cache: {
                paths: [
                  "node_modules/**/*",
                  ".next/cache/**/*",
                ],
              },
            },
          },
        ],
      }),

      // Environment variables
      environmentVariables: {
        // AI Services
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
        LANGCHAIN_TRACING_V2: "true",
        LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY || "",
        LANGCHAIN_PROJECT: "ats-resume-builder",
        LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY || "",

        // AWS Configuration
        AWS_REGION: "us-east-1",
        AWS_S3_UPLOAD_BUCKET: "ats-resume-uploads-790756194179-us-east-1",
        AWS_S3_STATIC_BUCKET: "ats-resume-static-790756194179-us-east-1",
        API_GATEWAY_URL: "https://nkxintctea.execute-api.us-east-1.amazonaws.com/prod",
        AWS_XRAY_TRACING_NAME: "ats-resume-builder",

        // Lambda Function URLs (Direct Invocation)
        RESUME_FUNCTION_URL: "https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/",
        COVER_LETTER_FUNCTION_URL: "https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/",

        // Application
        NEXT_PUBLIC_APP_URL: `https://${props.domainName}`,
        NODE_ENV: "production",
        LOG_LEVEL: "info",
        USE_MOCK_DATA: "false",

        // CloudWatch
        CLOUDWATCH_LOG_GROUP: "/ats-resume/application-logs",
        CLOUDWATCH_LOG_STREAM: "production",

        // Feature Flags
        ENABLE_XRAY_TRACING: "true",
        ENABLE_LANGSMITH_TRACING: "true",
        ENABLE_DEBUG_LOGGING: "false",
        LOG_SAMPLE_RATE: "0.1",

        // Next.js specific
        AMPLIFY_MONOREPO_APP_ROOT: ".",
        AMPLIFY_DIFF_DEPLOY: "false",
        _LIVE_UPDATES: '[{"name":"Next.js version","pkg":"next","type":"npm","version_run":"npx next --version"}]',
      },

      // Custom rules for SPA routing
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: amplify.RedirectStatus.NOT_FOUND_REWRITE,
        },
        {
          source: "/api/<*>",
          target: "https://nkxintctea.execute-api.us-east-1.amazonaws.com/prod/api/<*>",
          status: amplify.RedirectStatus.TEMPORARY_REDIRECT,
        },
      ],

      // Platform for Next.js SSR support
      platform: amplify.Platform.WEB_COMPUTE,
    });

    // Add main branch
    const mainBranch = this.amplifyApp.addBranch("main", {
      branchName: props.githubBranch || "main",
      autoBuild: true,
      pullRequestPreview: true,
    });

    // Add custom domain
    const domain = this.amplifyApp.addDomain(props.domainName, {
      domainName: props.domainName,
      subDomains: [
        {
          branch: mainBranch,
          prefix: "",
        },
      ],
      autoSubdomainCreationPatterns: ["*", "pr*"],
    });

    // Grant Amplify permissions to access other AWS services
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

    // Outputs
    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: this.amplifyApp.appId,
      description: "Amplify App ID",
    });

    new cdk.CfnOutput(this, "AmplifyAppUrl", {
      value: `https://${this.amplifyApp.appId}.amplifyapp.com`,
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
      value: `https://console.aws.amazon.com/amplify/home?region=${this.region}#/${this.amplifyApp.appId}`,
      description: "Amplify Console URL",
    });
  }
}
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export class AtsStack extends cdk.Stack {
  public readonly uploadBucket: s3.Bucket;
  public readonly staticBucket: s3.Bucket;
  public readonly api: apigateway.RestApi;
  public readonly processFileFunction: lambda.Function;
  public readonly uploadFunction: lambda.Function;
  public readonly generateResumeFunction: lambda.Function;
  public readonly generateCoverLetterFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for user uploads
    this.uploadBucket = new s3.Bucket(this, "UserUploadsBucket", {
      bucketName: `ats-resume-uploads-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: "DeleteOldFiles",
          expiration: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ["*"],
        },
      ],
    });

    // S3 Bucket for static hosting
    this.staticBucket = new s3.Bucket(this, "StaticSiteBucket", {
      bucketName: `ats-resume-static-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Grant S3 access
    this.uploadBucket.grantReadWrite(lambdaRole);
    this.staticBucket.grantRead(lambdaRole);

    // Grant X-Ray permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
        ],
        resources: ["*"],
      })
    );

    // Grant CloudWatch Metrics permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "cloudwatch:namespace": "ATSResumeBuilder",
          },
        },
      })
    );

    // Process File Lambda
    this.processFileFunction = new lambda.Function(this, "ProcessFileFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "dist/handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/processFile")),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        AWS_S3_UPLOAD_BUCKET: this.uploadBucket.bucketName,
        ENABLE_XRAY_TRACING: "true",
        LOG_LEVEL: "info",
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Upload Lambda
    this.uploadFunction = new lambda.Function(this, "UploadFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "dist/handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/upload")),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        AWS_S3_UPLOAD_BUCKET: this.uploadBucket.bucketName,
        ENABLE_XRAY_TRACING: "true",
        LOG_LEVEL: "info",
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Generate Resume Lambda with Function URL
    this.generateResumeFunction = new lambda.Function(
      this,
      "GenerateResumeFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "dist/handler.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../lambda/generateResume")
        ),
        role: lambdaRole,
        timeout: cdk.Duration.seconds(900), // 15 minutes for complex processing
        memorySize: 3008, // Maximum memory for better performance
        environment: {
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
          LANGCHAIN_TRACING_V2: "true",
          LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY || "",
          LANGCHAIN_PROJECT: "ats-resume-builder",
          LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY || "",
          ENABLE_XRAY_TRACING: "true",
          ENABLE_LANGSMITH_TRACING: "true",
          LOG_LEVEL: "info",
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Add Function URL for direct invocation
    const resumeFunctionUrl = this.generateResumeFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["https://resume-generator-ai.solutionsynth.cloud"],
        allowedMethods: [lambda.HttpMethod.POST],
        allowedHeaders: ["*"],
        maxAge: cdk.Duration.seconds(300),
      },
    });

    // Generate Cover Letter Lambda with Function URL
    this.generateCoverLetterFunction = new lambda.Function(
      this,
      "GenerateCoverLetterFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "dist/handler.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../lambda/generateCoverLetter")
        ),
        role: lambdaRole,
        timeout: cdk.Duration.seconds(600), // 10 minutes for cover letters
        memorySize: 2048,
        environment: {
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
          LANGCHAIN_TRACING_V2: "true",
          LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY || "",
          LANGCHAIN_PROJECT: "ats-resume-builder",
          LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY || "",
          ENABLE_XRAY_TRACING: "true",
          ENABLE_LANGSMITH_TRACING: "true",
          LOG_LEVEL: "info",
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Add Function URL for direct invocation
    const coverLetterFunctionUrl = this.generateCoverLetterFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["https://resume-generator-ai.solutionsynth.cloud"],
        allowedMethods: [lambda.HttpMethod.POST],
        allowedHeaders: ["*"],
        maxAge: cdk.Duration.seconds(300),
      },
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, "AtsResumeApi", {
      restApiName: "ATS Resume Builder API",
      description: "API for ATS Resume Builder",
      defaultCorsPreflightOptions: {
        allowOrigins: [
          "https://resume-generator-ai.solutionsynth.cloud",
          "http://localhost:3000",
          "https://localhost:3000"
        ],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "x-request-id"],
      },
      deployOptions: {
        stageName: "prod",
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
      },
    });

    // API Gateway integration for Process File
    const processFileIntegration = new apigateway.LambdaIntegration(
      this.processFileFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    // API Gateway integration for Upload
    const uploadIntegration = new apigateway.LambdaIntegration(
      this.uploadFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    // API Gateway integration for Generate Resume (with extended timeout)
    const generateResumeIntegration = new apigateway.LambdaIntegration(
      this.generateResumeFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        timeout: cdk.Duration.seconds(29), // Maximum API Gateway timeout
      }
    );

    // API Gateway integration for Generate Cover Letter (with extended timeout)
    const generateCoverLetterIntegration = new apigateway.LambdaIntegration(
      this.generateCoverLetterFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        timeout: cdk.Duration.seconds(29), // Maximum API Gateway timeout
      }
    );

    // API Routes
    const processFileResource = this.api.root.addResource("process-file");
    processFileResource.addMethod("POST", processFileIntegration);

    const uploadResource = this.api.root.addResource("upload");
    uploadResource.addMethod("POST", uploadIntegration);

    // Keep existing routes for backward compatibility
    const generateResumeResource = this.api.root.addResource("generate-resume");
    generateResumeResource.addMethod("POST", generateResumeIntegration);

    const generateCoverLetterResource = this.api.root.addResource("generate-cover-letter");
    generateCoverLetterResource.addMethod("POST", generateCoverLetterIntegration);

    // Outputs
    new cdk.CfnOutput(this, "UploadBucketName", {
      value: this.uploadBucket.bucketName,
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: this.api.url,
    });

    // Output the Function URLs for direct Lambda invocation
    new cdk.CfnOutput(this, "ResumeFunctionUrl", {
      value: resumeFunctionUrl.url,
      description: "Lambda Function URL for Resume Generation (Direct)",
    });

    new cdk.CfnOutput(this, "CoverLetterFunctionUrl", {
      value: coverLetterFunctionUrl.url,
      description: "Lambda Function URL for Cover Letter Generation (Direct)",
    });
  }
}



"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtsStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambdaEventSources = __importStar(require("aws-cdk-lib/aws-lambda-event-sources"));
const path = __importStar(require("path"));
class AtsStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        // SQS Queues for async job processing
        this.jobQueue = new sqs.Queue(this, "ResumeJobQueue", {
            queueName: "ats-resume-job-queue",
            visibilityTimeout: cdk.Duration.seconds(180), // 3 minutes (longer than Lambda timeout)
            retentionPeriod: cdk.Duration.days(1), // Keep messages for 1 day
            deadLetterQueue: {
                queue: new sqs.Queue(this, "ResumeJobDLQ", {
                    queueName: "ats-resume-job-dlq",
                }),
                maxReceiveCount: 3, // Retry failed jobs 3 times
            },
        });
        const coverLetterQueue = new sqs.Queue(this, "CoverLetterJobQueue", {
            queueName: "ats-cover-letter-job-queue",
            visibilityTimeout: cdk.Duration.seconds(180), // 3 minutes (longer than Lambda timeout)
            retentionPeriod: cdk.Duration.days(1), // Keep messages for 1 day
            deadLetterQueue: {
                queue: new sqs.Queue(this, "CoverLetterJobDLQ", {
                    queueName: "ats-cover-letter-job-dlq",
                }),
                maxReceiveCount: 3, // Retry failed jobs 3 times
            },
        });
        // DynamoDB table for job status tracking
        this.jobStatusTable = new dynamodb.Table(this, "JobStatusTable", {
            tableName: "ats-resume-job-status",
            partitionKey: { name: "jobId", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Free tier friendly
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            timeToLiveAttribute: "ttl", // Auto-delete old jobs after 7 days
        });
        // Lambda execution role
        const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
            ],
        });
        // Grant S3 access
        this.uploadBucket.grantReadWrite(lambdaRole);
        this.staticBucket.grantRead(lambdaRole);
        // Grant SQS access
        this.jobQueue.grantSendMessages(lambdaRole);
        this.jobQueue.grantConsumeMessages(lambdaRole);
        coverLetterQueue.grantSendMessages(lambdaRole);
        coverLetterQueue.grantConsumeMessages(lambdaRole);
        // Grant DynamoDB access
        this.jobStatusTable.grantReadWriteData(lambdaRole);
        // Grant X-Ray permissions
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
            ],
            resources: ["*"],
        }));
        // Grant CloudWatch Metrics permissions
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["cloudwatch:PutMetricData"],
            resources: ["*"],
            conditions: {
                StringEquals: {
                    "cloudwatch:namespace": "ATSResumeBuilder",
                },
            },
        }));
        // Process File Lambda
        this.processFileFunction = new lambda.Function(this, "ProcessFileFunction", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "handler.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/processFile/dist")),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                AWS_S3_UPLOAD_BUCKET: this.uploadBucket.bucketName,
                RESUME_JOB_QUEUE_URL: this.jobQueue.queueUrl,
                COVER_LETTER_JOB_QUEUE_URL: coverLetterQueue.queueUrl,
                JOB_STATUS_TABLE: this.jobStatusTable.tableName,
                ENABLE_XRAY_TRACING: "true",
                LOG_LEVEL: "info",
            },
            tracing: lambda.Tracing.ACTIVE,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Generate Resume Lambda
        this.generateResumeFunction = new lambda.Function(this, "GenerateResumeFunction", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "handler.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/generateResume/dist")),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(120),
            memorySize: 1024,
            environment: {
                ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
                LANGCHAIN_TRACING_V2: "true",
                LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY || "",
                LANGCHAIN_PROJECT: "ats-resume-builder",
                LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY || "",
                RESUME_JOB_QUEUE_URL: this.jobQueue.queueUrl,
                COVER_LETTER_JOB_QUEUE_URL: coverLetterQueue.queueUrl,
                JOB_STATUS_TABLE: this.jobStatusTable.tableName,
                ENABLE_XRAY_TRACING: "true",
                ENABLE_LANGSMITH_TRACING: "true",
                LOG_LEVEL: "info",
            },
            tracing: lambda.Tracing.ACTIVE,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Generate Cover Letter Lambda
        this.generateCoverLetterFunction = new lambda.Function(this, "GenerateCoverLetterFunction", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "handler.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/generateCoverLetter/dist")),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(90),
            memorySize: 1024,
            environment: {
                ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
                LANGCHAIN_TRACING_V2: "true",
                LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY || "",
                LANGCHAIN_PROJECT: "ats-resume-builder",
                LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY || "",
                RESUME_JOB_QUEUE_URL: this.jobQueue.queueUrl,
                COVER_LETTER_JOB_QUEUE_URL: coverLetterQueue.queueUrl,
                JOB_STATUS_TABLE: this.jobStatusTable.tableName,
                ENABLE_XRAY_TRACING: "true",
                ENABLE_LANGSMITH_TRACING: "true",
                LOG_LEVEL: "info",
            },
            tracing: lambda.Tracing.ACTIVE,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Job Manager Lambda
        this.jobManagerFunction = new lambda.Function(this, "JobManagerFunction", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "handler.createJob", // Default handler for job creation
            code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/jobManager/dist")),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                RESUME_JOB_QUEUE_URL: this.jobQueue.queueUrl,
                COVER_LETTER_JOB_QUEUE_URL: coverLetterQueue.queueUrl,
                JOB_STATUS_TABLE: this.jobStatusTable.tableName,
                ENABLE_XRAY_TRACING: "true",
                LOG_LEVEL: "info",
            },
            tracing: lambda.Tracing.ACTIVE,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Add SQS event source to trigger Lambda functions
        this.generateResumeFunction.addEventSource(new lambdaEventSources.SqsEventSource(this.jobQueue, {
            batchSize: 1, // Process one job at a time
            maxBatchingWindow: cdk.Duration.seconds(5),
        }));
        this.generateCoverLetterFunction.addEventSource(new lambdaEventSources.SqsEventSource(coverLetterQueue, {
            batchSize: 1, // Process one job at a time  
            maxBatchingWindow: cdk.Duration.seconds(5),
        }));
        // API Gateway
        this.api = new apigateway.RestApi(this, "AtsResumeApi", {
            restApiName: "ATS Resume Builder API",
            description: "API for ATS Resume Builder",
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
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
        const processFileIntegration = new apigateway.LambdaIntegration(this.processFileFunction, {
            requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        });
        // API Gateway integration for Job Manager
        const jobManagerCreateIntegration = new apigateway.LambdaIntegration(this.jobManagerFunction, {
            requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        });
        // Job Manager with different handler for status checking
        const jobManagerStatusFunction = new lambda.Function(this, "JobManagerStatusFunction", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "handler.getJobStatus",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/jobManager/dist")),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: {
                RESUME_JOB_QUEUE_URL: this.jobQueue.queueUrl,
                COVER_LETTER_JOB_QUEUE_URL: coverLetterQueue.queueUrl,
                JOB_STATUS_TABLE: this.jobStatusTable.tableName,
                ENABLE_XRAY_TRACING: "true",
                LOG_LEVEL: "info",
            },
            tracing: lambda.Tracing.ACTIVE,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        const jobManagerStatusIntegration = new apigateway.LambdaIntegration(jobManagerStatusFunction, {
            requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        });
        // API Gateway integration for Generate Resume (with extended timeout)
        const generateResumeIntegration = new apigateway.LambdaIntegration(this.generateResumeFunction, {
            requestTemplates: { "application/json": '{ "statusCode": "200" }' },
            timeout: cdk.Duration.seconds(29), // Maximum API Gateway timeout
        });
        // API Gateway integration for Generate Cover Letter (with extended timeout)
        const generateCoverLetterIntegration = new apigateway.LambdaIntegration(this.generateCoverLetterFunction, {
            requestTemplates: { "application/json": '{ "statusCode": "200" }' },
            timeout: cdk.Duration.seconds(29), // Maximum API Gateway timeout
        });
        // API Routes
        const processFileResource = this.api.root.addResource("process-file");
        processFileResource.addMethod("POST", processFileIntegration);
        // Job management routes
        const jobsResource = this.api.root.addResource("jobs");
        jobsResource.addMethod("POST", jobManagerCreateIntegration); // Create job
        const jobStatusResource = jobsResource.addResource("{jobId}");
        jobStatusResource.addMethod("GET", jobManagerStatusIntegration); // Get job status
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
    }
}
exports.AtsStack = AtsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXRzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXRzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsK0RBQWlEO0FBQ2pELHVFQUF5RDtBQUN6RCx5REFBMkM7QUFDM0MsMkRBQTZDO0FBQzdDLHlEQUEyQztBQUMzQyxtRUFBcUQ7QUFDckQseUZBQTJFO0FBRTNFLDJDQUE2QjtBQUU3QixNQUFhLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztJQVdyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDM0QsVUFBVSxFQUFFLHNCQUFzQixJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDL0QsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUN2QyxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLGdCQUFnQjtvQkFDcEIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDakM7YUFDRjtZQUNELElBQUksRUFBRTtnQkFDSjtvQkFDRSxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ3JCLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO29CQUN4RCxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7aUJBQ3RCO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCwrQkFBK0I7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Q0FBQztRQUN2RCxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLENBQUMsYUFBYTtRQUUxRSxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUQsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCO1FBRWxGLGtEQUFrRDtRQUNsRCxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVFLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUseUJBQXlCLENBQUMsQ0FBQztRQUVwRSxNQUFNLDJCQUEyQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3ZGLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsOEJBQThCLENBQUMsQ0FBQztRQUU5RSxVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVO1NBQ3BDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUc7U0FDcEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBelZELDRCQXlWQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sb2dzXCI7XHJcbmltcG9ydCAqIGFzIHNxcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNxc1wiO1xyXG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiXCI7XHJcbmltcG9ydCAqIGFzIGxhbWJkYUV2ZW50U291cmNlcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ldmVudC1zb3VyY2VzXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBBdHNTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgcHVibGljIHJlYWRvbmx5IHVwbG9hZEJ1Y2tldDogczMuQnVja2V0O1xyXG4gIHB1YmxpYyByZWFkb25seSBzdGF0aWNCdWNrZXQ6IHMzLkJ1Y2tldDtcclxuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XHJcbiAgcHVibGljIHJlYWRvbmx5IHByb2Nlc3NGaWxlRnVuY3Rpb246IGxhbWJkYS5GdW5jdGlvbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgZ2VuZXJhdGVSZXN1bWVGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIHB1YmxpYyByZWFkb25seSBnZW5lcmF0ZUNvdmVyTGV0dGVyRnVuY3Rpb246IGxhbWJkYS5GdW5jdGlvbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgam9iTWFuYWdlckZ1bmN0aW9uOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IGpvYlF1ZXVlOiBzcXMuUXVldWU7XHJcbiAgcHVibGljIHJlYWRvbmx5IGpvYlN0YXR1c1RhYmxlOiBkeW5hbW9kYi5UYWJsZTtcclxuXHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gUzMgQnVja2V0IGZvciB1c2VyIHVwbG9hZHNcclxuICAgIHRoaXMudXBsb2FkQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIlVzZXJVcGxvYWRzQnVja2V0XCIsIHtcclxuICAgICAgYnVja2V0TmFtZTogYGF0cy1yZXN1bWUtdXBsb2Fkcy0ke3RoaXMuYWNjb3VudH0tJHt0aGlzLnJlZ2lvbn1gLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IFwiRGVsZXRlT2xkRmlsZXNcIixcclxuICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDcpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICAgIGNvcnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBhbGxvd2VkT3JpZ2luczogW1wiKlwiXSxcclxuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuR0VULCBzMy5IdHRwTWV0aG9kcy5QVVRdLFxyXG4gICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFtcIipcIl0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFMzIEJ1Y2tldCBmb3Igc3RhdGljIGhvc3RpbmdcclxuICAgIHRoaXMuc3RhdGljQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIlN0YXRpY1NpdGVCdWNrZXRcIiwge1xyXG4gICAgICBidWNrZXROYW1lOiBgYXRzLXJlc3VtZS1zdGF0aWMtJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogXCJpbmRleC5odG1sXCIsXHJcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU1FTIFF1ZXVlcyBmb3IgYXN5bmMgam9iIHByb2Nlc3NpbmdcclxuICAgIHRoaXMuam9iUXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsIFwiUmVzdW1lSm9iUXVldWVcIiwge1xyXG4gICAgICBxdWV1ZU5hbWU6IFwiYXRzLXJlc3VtZS1qb2ItcXVldWVcIixcclxuICAgICAgdmlzaWJpbGl0eVRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDE4MCksIC8vIDMgbWludXRlcyAobG9uZ2VyIHRoYW4gTGFtYmRhIHRpbWVvdXQpXHJcbiAgICAgIHJldGVudGlvblBlcmlvZDogY2RrLkR1cmF0aW9uLmRheXMoMSksIC8vIEtlZXAgbWVzc2FnZXMgZm9yIDEgZGF5XHJcbiAgICAgIGRlYWRMZXR0ZXJRdWV1ZToge1xyXG4gICAgICAgIHF1ZXVlOiBuZXcgc3FzLlF1ZXVlKHRoaXMsIFwiUmVzdW1lSm9iRExRXCIsIHtcclxuICAgICAgICAgIHF1ZXVlTmFtZTogXCJhdHMtcmVzdW1lLWpvYi1kbHFcIixcclxuICAgICAgICB9KSxcclxuICAgICAgICBtYXhSZWNlaXZlQ291bnQ6IDMsIC8vIFJldHJ5IGZhaWxlZCBqb2JzIDMgdGltZXNcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGNvdmVyTGV0dGVyUXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsIFwiQ292ZXJMZXR0ZXJKb2JRdWV1ZVwiLCB7XHJcbiAgICAgIHF1ZXVlTmFtZTogXCJhdHMtY292ZXItbGV0dGVyLWpvYi1xdWV1ZVwiLFxyXG4gICAgICB2aXNpYmlsaXR5VGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTgwKSwgLy8gMyBtaW51dGVzIChsb25nZXIgdGhhbiBMYW1iZGEgdGltZW91dClcclxuICAgICAgcmV0ZW50aW9uUGVyaW9kOiBjZGsuRHVyYXRpb24uZGF5cygxKSwgLy8gS2VlcCBtZXNzYWdlcyBmb3IgMSBkYXlcclxuICAgICAgZGVhZExldHRlclF1ZXVlOiB7XHJcbiAgICAgICAgcXVldWU6IG5ldyBzcXMuUXVldWUodGhpcywgXCJDb3ZlckxldHRlckpvYkRMUVwiLCB7XHJcbiAgICAgICAgICBxdWV1ZU5hbWU6IFwiYXRzLWNvdmVyLWxldHRlci1qb2ItZGxxXCIsXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgbWF4UmVjZWl2ZUNvdW50OiAzLCAvLyBSZXRyeSBmYWlsZWQgam9icyAzIHRpbWVzXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEeW5hbW9EQiB0YWJsZSBmb3Igam9iIHN0YXR1cyB0cmFja2luZ1xyXG4gICAgdGhpcy5qb2JTdGF0dXNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIkpvYlN0YXR1c1RhYmxlXCIsIHtcclxuICAgICAgdGFibGVOYW1lOiBcImF0cy1yZXN1bWUtam9iLXN0YXR1c1wiLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogXCJqb2JJZFwiLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULCAvLyBGcmVlIHRpZXIgZnJpZW5kbHlcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiBcInR0bFwiLCAvLyBBdXRvLWRlbGV0ZSBvbGQgam9icyBhZnRlciA3IGRheXNcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExhbWJkYSBleGVjdXRpb24gcm9sZVxyXG4gICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBcIkxhbWJkYUV4ZWN1dGlvblJvbGVcIiwge1xyXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbChcImxhbWJkYS5hbWF6b25hd3MuY29tXCIpLFxyXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcclxuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXHJcbiAgICAgICAgICBcInNlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGVcIlxyXG4gICAgICAgICksXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHcmFudCBTMyBhY2Nlc3NcclxuICAgIHRoaXMudXBsb2FkQnVja2V0LmdyYW50UmVhZFdyaXRlKGxhbWJkYVJvbGUpO1xyXG4gICAgdGhpcy5zdGF0aWNCdWNrZXQuZ3JhbnRSZWFkKGxhbWJkYVJvbGUpO1xyXG5cclxuICAgIC8vIEdyYW50IFNRUyBhY2Nlc3NcclxuICAgIHRoaXMuam9iUXVldWUuZ3JhbnRTZW5kTWVzc2FnZXMobGFtYmRhUm9sZSk7XHJcbiAgICB0aGlzLmpvYlF1ZXVlLmdyYW50Q29uc3VtZU1lc3NhZ2VzKGxhbWJkYVJvbGUpO1xyXG4gICAgY292ZXJMZXR0ZXJRdWV1ZS5ncmFudFNlbmRNZXNzYWdlcyhsYW1iZGFSb2xlKTtcclxuICAgIGNvdmVyTGV0dGVyUXVldWUuZ3JhbnRDb25zdW1lTWVzc2FnZXMobGFtYmRhUm9sZSk7XHJcblxyXG4gICAgLy8gR3JhbnQgRHluYW1vREIgYWNjZXNzXHJcbiAgICB0aGlzLmpvYlN0YXR1c1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcclxuXHJcbiAgICAvLyBHcmFudCBYLVJheSBwZXJtaXNzaW9uc1xyXG4gICAgbGFtYmRhUm9sZS5hZGRUb1BvbGljeShcclxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICBcInhyYXk6UHV0VHJhY2VTZWdtZW50c1wiLFxyXG4gICAgICAgICAgXCJ4cmF5OlB1dFRlbGVtZXRyeVJlY29yZHNcIixcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlc291cmNlczogW1wiKlwiXSxcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gR3JhbnQgQ2xvdWRXYXRjaCBNZXRyaWNzIHBlcm1pc3Npb25zXHJcbiAgICBsYW1iZGFSb2xlLmFkZFRvUG9saWN5KFxyXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgIGFjdGlvbnM6IFtcImNsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YVwiXSxcclxuICAgICAgICByZXNvdXJjZXM6IFtcIipcIl0sXHJcbiAgICAgICAgY29uZGl0aW9uczoge1xyXG4gICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XHJcbiAgICAgICAgICAgIFwiY2xvdWR3YXRjaDpuYW1lc3BhY2VcIjogXCJBVFNSZXN1bWVCdWlsZGVyXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIC8vIFByb2Nlc3MgRmlsZSBMYW1iZGFcclxuICAgIHRoaXMucHJvY2Vzc0ZpbGVGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJQcm9jZXNzRmlsZUZ1bmN0aW9uXCIsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgIGhhbmRsZXI6IFwiaGFuZGxlci5oYW5kbGVyXCIsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uL2xhbWJkYS9wcm9jZXNzRmlsZS9kaXN0XCIpKSxcclxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgQVdTX1MzX1VQTE9BRF9CVUNLRVQ6IHRoaXMudXBsb2FkQnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgUkVTVU1FX0pPQl9RVUVVRV9VUkw6IHRoaXMuam9iUXVldWUucXVldWVVcmwsXHJcbiAgICAgICAgQ09WRVJfTEVUVEVSX0pPQl9RVUVVRV9VUkw6IGNvdmVyTGV0dGVyUXVldWUucXVldWVVcmwsXHJcbiAgICAgICAgSk9CX1NUQVRVU19UQUJMRTogdGhpcy5qb2JTdGF0dXNUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgRU5BQkxFX1hSQVlfVFJBQ0lORzogXCJ0cnVlXCIsXHJcbiAgICAgICAgTE9HX0xFVkVMOiBcImluZm9cIixcclxuICAgICAgfSxcclxuICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdlbmVyYXRlIFJlc3VtZSBMYW1iZGFcclxuICAgIHRoaXMuZ2VuZXJhdGVSZXN1bWVGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24oXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgIFwiR2VuZXJhdGVSZXN1bWVGdW5jdGlvblwiLFxyXG4gICAgICB7XHJcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgICAgaGFuZGxlcjogXCJoYW5kbGVyLmhhbmRsZXJcIixcclxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXHJcbiAgICAgICAgICBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uL2xhbWJkYS9nZW5lcmF0ZVJlc3VtZS9kaXN0XCIpXHJcbiAgICAgICAgKSxcclxuICAgICAgICByb2xlOiBsYW1iZGFSb2xlLFxyXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEyMCksXHJcbiAgICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcclxuICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgQU5USFJPUElDX0FQSV9LRVk6IHByb2Nlc3MuZW52LkFOVEhST1BJQ19BUElfS0VZIHx8IFwiXCIsXHJcbiAgICAgICAgICBMQU5HQ0hBSU5fVFJBQ0lOR19WMjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICBMQU5HQ0hBSU5fQVBJX0tFWTogcHJvY2Vzcy5lbnYuTEFOR0NIQUlOX0FQSV9LRVkgfHwgXCJcIixcclxuICAgICAgICAgIExBTkdDSEFJTl9QUk9KRUNUOiBcImF0cy1yZXN1bWUtYnVpbGRlclwiLFxyXG4gICAgICAgICAgTEFOR1NNSVRIX0FQSV9LRVk6IHByb2Nlc3MuZW52LkxBTkdTTUlUSF9BUElfS0VZIHx8IFwiXCIsXHJcbiAgICAgICAgICBSRVNVTUVfSk9CX1FVRVVFX1VSTDogdGhpcy5qb2JRdWV1ZS5xdWV1ZVVybCxcclxuICAgICAgICAgIENPVkVSX0xFVFRFUl9KT0JfUVVFVUVfVVJMOiBjb3ZlckxldHRlclF1ZXVlLnF1ZXVlVXJsLFxyXG4gICAgICAgICAgSk9CX1NUQVRVU19UQUJMRTogdGhpcy5qb2JTdGF0dXNUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICBFTkFCTEVfWFJBWV9UUkFDSU5HOiBcInRydWVcIixcclxuICAgICAgICAgIEVOQUJMRV9MQU5HU01JVEhfVFJBQ0lORzogXCJ0cnVlXCIsXHJcbiAgICAgICAgICBMT0dfTEVWRUw6IFwiaW5mb1wiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxyXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdlbmVyYXRlIENvdmVyIExldHRlciBMYW1iZGFcclxuICAgIHRoaXMuZ2VuZXJhdGVDb3ZlckxldHRlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcclxuICAgICAgdGhpcyxcclxuICAgICAgXCJHZW5lcmF0ZUNvdmVyTGV0dGVyRnVuY3Rpb25cIixcclxuICAgICAge1xyXG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxyXG4gICAgICAgIGhhbmRsZXI6IFwiaGFuZGxlci5oYW5kbGVyXCIsXHJcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFxyXG4gICAgICAgICAgcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi8uLi9sYW1iZGEvZ2VuZXJhdGVDb3ZlckxldHRlci9kaXN0XCIpXHJcbiAgICAgICAgKSxcclxuICAgICAgICByb2xlOiBsYW1iZGFSb2xlLFxyXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDkwKSxcclxuICAgICAgICBtZW1vcnlTaXplOiAxMDI0LFxyXG4gICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICBBTlRIUk9QSUNfQVBJX0tFWTogcHJvY2Vzcy5lbnYuQU5USFJPUElDX0FQSV9LRVkgfHwgXCJcIixcclxuICAgICAgICAgIExBTkdDSEFJTl9UUkFDSU5HX1YyOiBcInRydWVcIixcclxuICAgICAgICAgIExBTkdDSEFJTl9BUElfS0VZOiBwcm9jZXNzLmVudi5MQU5HQ0hBSU5fQVBJX0tFWSB8fCBcIlwiLFxyXG4gICAgICAgICAgTEFOR0NIQUlOX1BST0pFQ1Q6IFwiYXRzLXJlc3VtZS1idWlsZGVyXCIsXHJcbiAgICAgICAgICBMQU5HU01JVEhfQVBJX0tFWTogcHJvY2Vzcy5lbnYuTEFOR1NNSVRIX0FQSV9LRVkgfHwgXCJcIixcclxuICAgICAgICAgIFJFU1VNRV9KT0JfUVVFVUVfVVJMOiB0aGlzLmpvYlF1ZXVlLnF1ZXVlVXJsLFxyXG4gICAgICAgICAgQ09WRVJfTEVUVEVSX0pPQl9RVUVVRV9VUkw6IGNvdmVyTGV0dGVyUXVldWUucXVldWVVcmwsXHJcbiAgICAgICAgICBKT0JfU1RBVFVTX1RBQkxFOiB0aGlzLmpvYlN0YXR1c1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIEVOQUJMRV9YUkFZX1RSQUNJTkc6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgRU5BQkxFX0xBTkdTTUlUSF9UUkFDSU5HOiBcInRydWVcIixcclxuICAgICAgICAgIExPR19MRVZFTDogXCJpbmZvXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXHJcbiAgICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gSm9iIE1hbmFnZXIgTGFtYmRhXHJcbiAgICB0aGlzLmpvYk1hbmFnZXJGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJKb2JNYW5hZ2VyRnVuY3Rpb25cIiwge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcclxuICAgICAgaGFuZGxlcjogXCJoYW5kbGVyLmNyZWF0ZUpvYlwiLCAvLyBEZWZhdWx0IGhhbmRsZXIgZm9yIGpvYiBjcmVhdGlvblxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi8uLi9sYW1iZGEvam9iTWFuYWdlci9kaXN0XCIpKSxcclxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgUkVTVU1FX0pPQl9RVUVVRV9VUkw6IHRoaXMuam9iUXVldWUucXVldWVVcmwsXHJcbiAgICAgICAgQ09WRVJfTEVUVEVSX0pPQl9RVUVVRV9VUkw6IGNvdmVyTGV0dGVyUXVldWUucXVldWVVcmwsXHJcbiAgICAgICAgSk9CX1NUQVRVU19UQUJMRTogdGhpcy5qb2JTdGF0dXNUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgRU5BQkxFX1hSQVlfVFJBQ0lORzogXCJ0cnVlXCIsXHJcbiAgICAgICAgTE9HX0xFVkVMOiBcImluZm9cIixcclxuICAgICAgfSxcclxuICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBTUVMgZXZlbnQgc291cmNlIHRvIHRyaWdnZXIgTGFtYmRhIGZ1bmN0aW9uc1xyXG4gICAgdGhpcy5nZW5lcmF0ZVJlc3VtZUZ1bmN0aW9uLmFkZEV2ZW50U291cmNlKFxyXG4gICAgICBuZXcgbGFtYmRhRXZlbnRTb3VyY2VzLlNxc0V2ZW50U291cmNlKHRoaXMuam9iUXVldWUsIHtcclxuICAgICAgICBiYXRjaFNpemU6IDEsIC8vIFByb2Nlc3Mgb25lIGpvYiBhdCBhIHRpbWVcclxuICAgICAgICBtYXhCYXRjaGluZ1dpbmRvdzogY2RrLkR1cmF0aW9uLnNlY29uZHMoNSksXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuZ2VuZXJhdGVDb3ZlckxldHRlckZ1bmN0aW9uLmFkZEV2ZW50U291cmNlKFxyXG4gICAgICBuZXcgbGFtYmRhRXZlbnRTb3VyY2VzLlNxc0V2ZW50U291cmNlKGNvdmVyTGV0dGVyUXVldWUsIHtcclxuICAgICAgICBiYXRjaFNpemU6IDEsIC8vIFByb2Nlc3Mgb25lIGpvYiBhdCBhIHRpbWUgIFxyXG4gICAgICAgIG1heEJhdGNoaW5nV2luZG93OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg1KSxcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gQVBJIEdhdGV3YXlcclxuICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBcIkF0c1Jlc3VtZUFwaVwiLCB7XHJcbiAgICAgIHJlc3RBcGlOYW1lOiBcIkFUUyBSZXN1bWUgQnVpbGRlciBBUElcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiQVBJIGZvciBBVFMgUmVzdW1lIEJ1aWxkZXJcIixcclxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XHJcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXHJcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXHJcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbXCJDb250ZW50LVR5cGVcIiwgXCJYLUFtei1EYXRlXCIsIFwiQXV0aG9yaXphdGlvblwiLCBcIlgtQXBpLUtleVwiLCBcIngtcmVxdWVzdC1pZFwiXSxcclxuICAgICAgfSxcclxuICAgICAgZGVwbG95T3B0aW9uczoge1xyXG4gICAgICAgIHN0YWdlTmFtZTogXCJwcm9kXCIsXHJcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxyXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdHJhY2luZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBUEkgR2F0ZXdheSBpbnRlZ3JhdGlvbiBmb3IgUHJvY2VzcyBGaWxlXHJcbiAgICBjb25zdCBwcm9jZXNzRmlsZUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXHJcbiAgICAgIHRoaXMucHJvY2Vzc0ZpbGVGdW5jdGlvbixcclxuICAgICAge1xyXG4gICAgICAgIHJlcXVlc3RUZW1wbGF0ZXM6IHsgXCJhcHBsaWNhdGlvbi9qc29uXCI6ICd7IFwic3RhdHVzQ29kZVwiOiBcIjIwMFwiIH0nIH0sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gQVBJIEdhdGV3YXkgaW50ZWdyYXRpb24gZm9yIEpvYiBNYW5hZ2VyXHJcbiAgICBjb25zdCBqb2JNYW5hZ2VyQ3JlYXRlSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihcclxuICAgICAgdGhpcy5qb2JNYW5hZ2VyRnVuY3Rpb24sXHJcbiAgICAgIHtcclxuICAgICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7IFwiYXBwbGljYXRpb24vanNvblwiOiAneyBcInN0YXR1c0NvZGVcIjogXCIyMDBcIiB9JyB9LFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEpvYiBNYW5hZ2VyIHdpdGggZGlmZmVyZW50IGhhbmRsZXIgZm9yIHN0YXR1cyBjaGVja2luZ1xyXG4gICAgY29uc3Qgam9iTWFuYWdlclN0YXR1c0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIkpvYk1hbmFnZXJTdGF0dXNGdW5jdGlvblwiLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxyXG4gICAgICBoYW5kbGVyOiBcImhhbmRsZXIuZ2V0Sm9iU3RhdHVzXCIsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uL2xhbWJkYS9qb2JNYW5hZ2VyL2Rpc3RcIikpLFxyXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXHJcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBSRVNVTUVfSk9CX1FVRVVFX1VSTDogdGhpcy5qb2JRdWV1ZS5xdWV1ZVVybCxcclxuICAgICAgICBDT1ZFUl9MRVRURVJfSk9CX1FVRVVFX1VSTDogY292ZXJMZXR0ZXJRdWV1ZS5xdWV1ZVVybCxcclxuICAgICAgICBKT0JfU1RBVFVTX1RBQkxFOiB0aGlzLmpvYlN0YXR1c1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICBFTkFCTEVfWFJBWV9UUkFDSU5HOiBcInRydWVcIixcclxuICAgICAgICBMT0dfTEVWRUw6IFwiaW5mb1wiLFxyXG4gICAgICB9LFxyXG4gICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXHJcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgam9iTWFuYWdlclN0YXR1c0ludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXHJcbiAgICAgIGpvYk1hbmFnZXJTdGF0dXNGdW5jdGlvbixcclxuICAgICAge1xyXG4gICAgICAgIHJlcXVlc3RUZW1wbGF0ZXM6IHsgXCJhcHBsaWNhdGlvbi9qc29uXCI6ICd7IFwic3RhdHVzQ29kZVwiOiBcIjIwMFwiIH0nIH0sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gQVBJIEdhdGV3YXkgaW50ZWdyYXRpb24gZm9yIEdlbmVyYXRlIFJlc3VtZSAod2l0aCBleHRlbmRlZCB0aW1lb3V0KVxyXG4gICAgY29uc3QgZ2VuZXJhdGVSZXN1bWVJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKFxyXG4gICAgICB0aGlzLmdlbmVyYXRlUmVzdW1lRnVuY3Rpb24sXHJcbiAgICAgIHtcclxuICAgICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7IFwiYXBwbGljYXRpb24vanNvblwiOiAneyBcInN0YXR1c0NvZGVcIjogXCIyMDBcIiB9JyB9LFxyXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDI5KSwgLy8gTWF4aW11bSBBUEkgR2F0ZXdheSB0aW1lb3V0XHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gQVBJIEdhdGV3YXkgaW50ZWdyYXRpb24gZm9yIEdlbmVyYXRlIENvdmVyIExldHRlciAod2l0aCBleHRlbmRlZCB0aW1lb3V0KVxyXG4gICAgY29uc3QgZ2VuZXJhdGVDb3ZlckxldHRlckludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXHJcbiAgICAgIHRoaXMuZ2VuZXJhdGVDb3ZlckxldHRlckZ1bmN0aW9uLFxyXG4gICAgICB7XHJcbiAgICAgICAgcmVxdWVzdFRlbXBsYXRlczogeyBcImFwcGxpY2F0aW9uL2pzb25cIjogJ3sgXCJzdGF0dXNDb2RlXCI6IFwiMjAwXCIgfScgfSxcclxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygyOSksIC8vIE1heGltdW0gQVBJIEdhdGV3YXkgdGltZW91dFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEFQSSBSb3V0ZXNcclxuICAgIGNvbnN0IHByb2Nlc3NGaWxlUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKFwicHJvY2Vzcy1maWxlXCIpO1xyXG4gICAgcHJvY2Vzc0ZpbGVSZXNvdXJjZS5hZGRNZXRob2QoXCJQT1NUXCIsIHByb2Nlc3NGaWxlSW50ZWdyYXRpb24pO1xyXG5cclxuICAgIC8vIEpvYiBtYW5hZ2VtZW50IHJvdXRlc1xyXG4gICAgY29uc3Qgam9ic1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZShcImpvYnNcIik7XHJcbiAgICBqb2JzUmVzb3VyY2UuYWRkTWV0aG9kKFwiUE9TVFwiLCBqb2JNYW5hZ2VyQ3JlYXRlSW50ZWdyYXRpb24pOyAvLyBDcmVhdGUgam9iXHJcbiAgICBcclxuICAgIGNvbnN0IGpvYlN0YXR1c1Jlc291cmNlID0gam9ic1Jlc291cmNlLmFkZFJlc291cmNlKFwie2pvYklkfVwiKTtcclxuICAgIGpvYlN0YXR1c1Jlc291cmNlLmFkZE1ldGhvZChcIkdFVFwiLCBqb2JNYW5hZ2VyU3RhdHVzSW50ZWdyYXRpb24pOyAvLyBHZXQgam9iIHN0YXR1c1xyXG5cclxuICAgIC8vIEtlZXAgZXhpc3Rpbmcgcm91dGVzIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XHJcbiAgICBjb25zdCBnZW5lcmF0ZVJlc3VtZVJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZShcImdlbmVyYXRlLXJlc3VtZVwiKTtcclxuICAgIGdlbmVyYXRlUmVzdW1lUmVzb3VyY2UuYWRkTWV0aG9kKFwiUE9TVFwiLCBnZW5lcmF0ZVJlc3VtZUludGVncmF0aW9uKTtcclxuXHJcbiAgICBjb25zdCBnZW5lcmF0ZUNvdmVyTGV0dGVyUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKFwiZ2VuZXJhdGUtY292ZXItbGV0dGVyXCIpO1xyXG4gICAgZ2VuZXJhdGVDb3ZlckxldHRlclJlc291cmNlLmFkZE1ldGhvZChcIlBPU1RcIiwgZ2VuZXJhdGVDb3ZlckxldHRlckludGVncmF0aW9uKTtcclxuXHJcbiAgICAvLyBPdXRwdXRzXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIlVwbG9hZEJ1Y2tldE5hbWVcIiwge1xyXG4gICAgICB2YWx1ZTogdGhpcy51cGxvYWRCdWNrZXQuYnVja2V0TmFtZSxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQXBpR2F0ZXdheVVybFwiLCB7XHJcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS51cmwsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcblxyXG4iXX0=
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
export declare class AtsStack extends cdk.Stack {
    readonly uploadBucket: s3.Bucket;
    readonly staticBucket: s3.Bucket;
    readonly api: apigateway.RestApi;
    readonly processFileFunction: lambda.Function;
    readonly generateResumeFunction: lambda.Function;
    readonly generateCoverLetterFunction: lambda.Function;
    readonly jobManagerFunction: lambda.Function;
    readonly jobQueue: sqs.Queue;
    readonly jobStatusTable: dynamodb.Table;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}

import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface CloudFrontHostingStackProps extends cdk.StackProps {
  domainName: string; // resume-generator-ai.solutionsynth.cloud
  hostedZoneId: string; // Your Route53 hosted zone ID for solutionsynth.cloud
}

export class CloudFrontHostingStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;
  public readonly certificate: certificatemanager.Certificate;

  constructor(scope: Construct, id: string, props: CloudFrontHostingStackProps) {
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

    // Create S3 bucket for hosting
    this.bucket = new s3.Bucket(this, "HostingBucket", {
      bucketName: `resume-generator-hosting-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      publicReadAccess: false, // CloudFront will handle access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html", // SPA routing
    });

    // Create CloudFront Origin Access Control
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, "OAC", {
      description: "OAC for Resume Generator AI",
    });

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        // API routes should proxy to API Gateway
        "/api/*": {
          origin: new origins.HttpOrigin("nkxintctea.execute-api.us-east-1.amazonaws.com", {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originPath: "/prod",
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        },
      },
      domainNames: [props.domainName],
      certificate: this.certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html", // SPA routing
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html", // SPA routing
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      comment: "Resume Generator AI - CloudFront Distribution",
    });

    // Create Route53 record
    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: "resume-generator-ai",
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
    });

    // Grant CloudFront access to S3 bucket
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        actions: ["s3:GetObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    );

    // Outputs
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
      description: "CloudFront Distribution Domain Name",
    });

    new cdk.CfnOutput(this, "CustomDomainName", {
      value: props.domainName,
      description: "Custom Domain Name",
    });

    new cdk.CfnOutput(this, "CustomDomainUrl", {
      value: `https://${props.domainName}`,
      description: "Custom Domain URL",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
      description: "CloudFront Distribution ID",
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: this.bucket.bucketName,
      description: "S3 Hosting Bucket Name",
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: this.certificate.certificateArn,
      description: "SSL Certificate ARN",
    });

    new cdk.CfnOutput(this, "DeploymentCommand", {
      value: `aws s3 sync .next/out s3://${this.bucket.bucketName} --delete && aws cloudfront create-invalidation --distribution-id ${this.distribution.distributionId} --paths "/*"`,
      description: "Command to deploy Next.js static export",
    });
  }
}
import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";
import { AtsStack } from "./ats-stack";

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get references from main stack
    const atsStack = cdk.Stack.of(this).node.tryFindChild("AtsResumeStack") as AtsStack;
    
    // This would need to be passed as a parameter in a real scenario
    // For now, we'll create a basic dashboard structure

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, "AtsResumeDashboard", {
      dashboardName: "ATS-Resume-Builder-Dashboard",
    });

    // Lambda Invocations Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Invocations",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Invocations",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Lambda Errors Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Errors",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Lambda Duration Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Duration",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Duration",
            statistic: "Average",
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Duration",
            statistic: "p95",
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Duration",
            statistic: "p99",
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // API Gateway Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "API Gateway Metrics",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "Count",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "4XXError",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "5XXError",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Custom Metrics Widget (if available)
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Custom Application Metrics",
        left: [
          new cloudwatch.Metric({
            namespace: "ATSResumeBuilder",
            metricName: "processFileLatency",
            statistic: "Average",
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: "ATSResumeBuilder",
            metricName: "generateResumeLatency",
            statistic: "Average",
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: "ATSResumeBuilder",
            metricName: "generateCoverLetterLatency",
            statistic: "Average",
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );
  }
}



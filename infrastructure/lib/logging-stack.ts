import * as cdk from "aws-cdk-lib";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import { Construct } from "constructs";

export class LoggingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Log Groups
    const processFileLogGroup = new logs.LogGroup(
      this,
      "ProcessFileLogGroup",
      {
        logGroupName: "/aws/lambda/ats-resume-processFile",
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    const generateResumeLogGroup = new logs.LogGroup(
      this,
      "GenerateResumeLogGroup",
      {
        logGroupName: "/aws/lambda/ats-resume-generateResume",
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    const generateCoverLetterLogGroup = new logs.LogGroup(
      this,
      "GenerateCoverLetterLogGroup",
      {
        logGroupName: "/aws/lambda/ats-resume-generateCoverLetter",
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    const applicationLogGroup = new logs.LogGroup(
      this,
      "ApplicationLogGroup",
      {
        logGroupName: "/ats-resume/application-logs",
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // Error Log Group (30 days retention)
    const errorLogGroup = new logs.LogGroup(this, "ErrorLogGroup", {
      logGroupName: "/ats-resume/error-logs",
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // SNS Topic for Alarms
    const alarmTopic = new sns.Topic(this, "AlarmTopic", {
      topicName: "ats-resume-alarms",
      displayName: "ATS Resume Builder Alarms",
    });

    // Alarms
    // Error Rate Alarm
    const errorRateAlarm = new cloudwatch.Alarm(this, "ErrorRateAlarm", {
      alarmName: "ats-resume-error-rate",
      alarmDescription: "Alert when error rate exceeds 5%",
      metric: new cloudwatch.Metric({
        namespace: "AWS/Lambda",
        metricName: "Errors",
        statistic: "Sum",
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    errorRateAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      "LambdaDurationAlarm",
      {
        alarmName: "ats-resume-lambda-duration",
        alarmDescription: "Alert when Lambda duration exceeds 25s (P95)",
        metric: new cloudwatch.Metric({
          namespace: "AWS/Lambda",
          metricName: "Duration",
          statistic: "p95",
          period: cdk.Duration.minutes(5),
        }),
        threshold: 25000, // 25 seconds in milliseconds
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    lambdaDurationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // API Gateway Latency Alarm
    const apiLatencyAlarm = new cloudwatch.Alarm(
      this,
      "ApiLatencyAlarm",
      {
        alarmName: "ats-resume-api-latency",
        alarmDescription: "Alert when API latency exceeds 10s (P95)",
        metric: new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "Latency",
          statistic: "p95",
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000, // 10 seconds in milliseconds
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    apiLatencyAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Outputs
    new cdk.CfnOutput(this, "AlarmTopicArn", {
      value: alarmTopic.topicArn,
      description: "SNS Topic ARN for alarms",
    });
  }
}



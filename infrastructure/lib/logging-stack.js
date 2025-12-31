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
exports.LoggingStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const cloudwatch_actions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
class LoggingStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Log Groups
        const processFileLogGroup = new logs.LogGroup(this, "ProcessFileLogGroup", {
            logGroupName: "/aws/lambda/ats-resume-processFile",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        const generateResumeLogGroup = new logs.LogGroup(this, "GenerateResumeLogGroup", {
            logGroupName: "/aws/lambda/ats-resume-generateResume",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        const generateCoverLetterLogGroup = new logs.LogGroup(this, "GenerateCoverLetterLogGroup", {
            logGroupName: "/aws/lambda/ats-resume-generateCoverLetter",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        const applicationLogGroup = new logs.LogGroup(this, "ApplicationLogGroup", {
            logGroupName: "/ats-resume/application-logs",
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
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
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });
        errorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
        // Lambda Duration Alarm
        const lambdaDurationAlarm = new cloudwatch.Alarm(this, "LambdaDurationAlarm", {
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
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });
        lambdaDurationAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
        // API Gateway Latency Alarm
        const apiLatencyAlarm = new cloudwatch.Alarm(this, "ApiLatencyAlarm", {
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
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });
        apiLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
        // Outputs
        new cdk.CfnOutput(this, "AlarmTopicArn", {
            value: alarmTopic.topicArn,
            description: "SNS Topic ARN for alarms",
        });
    }
}
exports.LoggingStack = LoggingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxvZ2dpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLDJEQUE2QztBQUM3Qyx1RUFBeUQ7QUFDekQseURBQTJDO0FBQzNDLHVGQUF5RTtBQUd6RSxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGFBQWE7UUFDYixNQUFNLG1CQUFtQixHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FDM0MsSUFBSSxFQUNKLHFCQUFxQixFQUNyQjtZQUNFLFlBQVksRUFBRSxvQ0FBb0M7WUFDbEQsU0FBUyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUN0QyxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQ0YsQ0FBQztRQUVGLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUM5QyxJQUFJLEVBQ0osd0JBQXdCLEVBQ3hCO1lBQ0UsWUFBWSxFQUFFLHVDQUF1QztZQUNyRCxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRO1lBQ3RDLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07U0FDeEMsQ0FDRixDQUFDO1FBRUYsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQ25ELElBQUksRUFDSiw2QkFBNkIsRUFDN0I7WUFDRSxZQUFZLEVBQUUsNENBQTRDO1lBQzFELFNBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDdEMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFB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RyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQ2hDLENBQUM7WUFDRixTQUFTLEVBQUUsS0FBSyxFQUFFLDZCQUE2QjtZQUMvQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGtCQUFrQixFQUNoQixVQUFVLENBQUMsa0JBQWtCLENBQUMsc0JBQXNCO1NBQ3ZELENBQ0YsQ0FBQztRQUVGLGVBQWUsQ0FBQyxjQUFjLENBQzVCLElBQUksa0JBQWtCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUM3QyxDQUFDO1FBRUYsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxVQUFVLENBQUMsUUFBUTtZQUMxQixXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXJJRCxvQ0FxSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sb2dzXCI7XHJcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoXCI7XHJcbmltcG9ydCAqIGFzIHNucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNuc1wiO1xyXG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoX2FjdGlvbnMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnNcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBMb2dnaW5nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vIExvZyBHcm91cHNcclxuICAgIGNvbnN0IHByb2Nlc3NGaWxlTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cChcclxuICAgICAgdGhpcyxcclxuICAgICAgXCJQcm9jZXNzRmlsZUxvZ0dyb3VwXCIsXHJcbiAgICAgIHtcclxuICAgICAgICBsb2dHcm91cE5hbWU6IFwiL2F3cy9sYW1iZGEvYXRzLXJlc3VtZS1wcm9jZXNzRmlsZVwiLFxyXG4gICAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBnZW5lcmF0ZVJlc3VtZUxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgIFwiR2VuZXJhdGVSZXN1bWVMb2dHcm91cFwiLFxyXG4gICAgICB7XHJcbiAgICAgICAgbG9nR3JvdXBOYW1lOiBcIi9hd3MvbGFtYmRhL2F0cy1yZXN1bWUtZ2VuZXJhdGVSZXN1bWVcIixcclxuICAgICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZ2VuZXJhdGVDb3ZlckxldHRlckxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgIFwiR2VuZXJhdGVDb3ZlckxldHRlckxvZ0dyb3VwXCIsXHJcbiAgICAgIHtcclxuICAgICAgICBsb2dHcm91cE5hbWU6IFwiL2F3cy9sYW1iZGEvYXRzLXJlc3VtZS1nZW5lcmF0ZUNvdmVyTGV0dGVyXCIsXHJcbiAgICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGFwcGxpY2F0aW9uTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cChcclxuICAgICAgdGhpcyxcclxuICAgICAgXCJBcHBsaWNhdGlvbkxvZ0dyb3VwXCIsXHJcbiAgICAgIHtcclxuICAgICAgICBsb2dHcm91cE5hbWU6IFwiL2F0cy1yZXN1bWUvYXBwbGljYXRpb24tbG9nc1wiLFxyXG4gICAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBFcnJvciBMb2cgR3JvdXAgKDMwIGRheXMgcmV0ZW50aW9uKVxyXG4gICAgY29uc3QgZXJyb3JMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsIFwiRXJyb3JMb2dHcm91cFwiLCB7XHJcbiAgICAgIGxvZ0dyb3VwTmFtZTogXCIvYXRzLXJlc3VtZS9lcnJvci1sb2dzXCIsXHJcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU05TIFRvcGljIGZvciBBbGFybXNcclxuICAgIGNvbnN0IGFsYXJtVG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsIFwiQWxhcm1Ub3BpY1wiLCB7XHJcbiAgICAgIHRvcGljTmFtZTogXCJhdHMtcmVzdW1lLWFsYXJtc1wiLFxyXG4gICAgICBkaXNwbGF5TmFtZTogXCJBVFMgUmVzdW1lIEJ1aWxkZXIgQWxhcm1zXCIsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBbGFybXNcclxuICAgIC8vIEVycm9yIFJhdGUgQWxhcm1cclxuICAgIGNvbnN0IGVycm9yUmF0ZUFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgXCJFcnJvclJhdGVBbGFybVwiLCB7XHJcbiAgICAgIGFsYXJtTmFtZTogXCJhdHMtcmVzdW1lLWVycm9yLXJhdGVcIixcclxuICAgICAgYWxhcm1EZXNjcmlwdGlvbjogXCJBbGVydCB3aGVuIGVycm9yIHJhdGUgZXhjZWVkcyA1JVwiLFxyXG4gICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgbmFtZXNwYWNlOiBcIkFXUy9MYW1iZGFcIixcclxuICAgICAgICBtZXRyaWNOYW1lOiBcIkVycm9yc1wiLFxyXG4gICAgICAgIHN0YXRpc3RpYzogXCJTdW1cIixcclxuICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICB9KSxcclxuICAgICAgdGhyZXNob2xkOiA1LFxyXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcclxuICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxyXG4gICAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9USFJFU0hPTEQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBlcnJvclJhdGVBbGFybS5hZGRBbGFybUFjdGlvbihcclxuICAgICAgbmV3IGNsb3Vkd2F0Y2hfYWN0aW9ucy5TbnNBY3Rpb24oYWxhcm1Ub3BpYylcclxuICAgICk7XHJcblxyXG4gICAgLy8gTGFtYmRhIER1cmF0aW9uIEFsYXJtXHJcbiAgICBjb25zdCBsYW1iZGFEdXJhdGlvbkFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0oXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgIFwiTGFtYmRhRHVyYXRpb25BbGFybVwiLFxyXG4gICAgICB7XHJcbiAgICAgICAgYWxhcm1OYW1lOiBcImF0cy1yZXN1bWUtbGFtYmRhLWR1cmF0aW9uXCIsXHJcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogXCJBbGVydCB3aGVuIExhbWJkYSBkdXJhdGlvbiBleGNlZWRzIDI1cyAoUDk1KVwiLFxyXG4gICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgIG5hbWVzcGFjZTogXCJBV1MvTGFtYmRhXCIsXHJcbiAgICAgICAgICBtZXRyaWNOYW1lOiBcIkR1cmF0aW9uXCIsXHJcbiAgICAgICAgICBzdGF0aXN0aWM6IFwicDk1XCIsXHJcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHRocmVzaG9sZDogMjUwMDAsIC8vIDI1IHNlY29uZHMgaW4gbWlsbGlzZWNvbmRzXHJcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXHJcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxyXG4gICAgICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICBsYW1iZGFEdXJhdGlvbkFsYXJtLmFkZEFsYXJtQWN0aW9uKFxyXG4gICAgICBuZXcgY2xvdWR3YXRjaF9hY3Rpb25zLlNuc0FjdGlvbihhbGFybVRvcGljKVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBBUEkgR2F0ZXdheSBMYXRlbmN5IEFsYXJtXHJcbiAgICBjb25zdCBhcGlMYXRlbmN5QWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybShcclxuICAgICAgdGhpcyxcclxuICAgICAgXCJBcGlMYXRlbmN5QWxhcm1cIixcclxuICAgICAge1xyXG4gICAgICAgIGFsYXJtTmFtZTogXCJhdHMtcmVzdW1lLWFwaS1sYXRlbmN5XCIsXHJcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogXCJBbGVydCB3aGVuIEFQSSBsYXRlbmN5IGV4Y2VlZHMgMTBzIChQOTUpXCIsXHJcbiAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgbmFtZXNwYWNlOiBcIkFXUy9BcGlHYXRld2F5XCIsXHJcbiAgICAgICAgICBtZXRyaWNOYW1lOiBcIkxhdGVuY3lcIixcclxuICAgICAgICAgIHN0YXRpc3RpYzogXCJwOTVcIixcclxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgdGhyZXNob2xkOiAxMDAwMCwgLy8gMTAgc2Vjb25kcyBpbiBtaWxsaXNlY29uZHNcclxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcclxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6XHJcbiAgICAgICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fVEhSRVNIT0xELFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGFwaUxhdGVuY3lBbGFybS5hZGRBbGFybUFjdGlvbihcclxuICAgICAgbmV3IGNsb3Vkd2F0Y2hfYWN0aW9ucy5TbnNBY3Rpb24oYWxhcm1Ub3BpYylcclxuICAgICk7XHJcblxyXG4gICAgLy8gT3V0cHV0c1xyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJBbGFybVRvcGljQXJuXCIsIHtcclxuICAgICAgdmFsdWU6IGFsYXJtVG9waWMudG9waWNBcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlNOUyBUb3BpYyBBUk4gZm9yIGFsYXJtc1wiLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuIl19
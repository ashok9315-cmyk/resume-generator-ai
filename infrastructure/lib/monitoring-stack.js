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
exports.MonitoringStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
class MonitoringStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Get references from main stack
        const atsStack = cdk.Stack.of(this).node.tryFindChild("AtsResumeStack");
        // This would need to be passed as a parameter in a real scenario
        // For now, we'll create a basic dashboard structure
        // CloudWatch Dashboard
        const dashboard = new cloudwatch.Dashboard(this, "AtsResumeDashboard", {
            dashboardName: "ATS-Resume-Builder-Dashboard",
        });
        // Lambda Invocations Widget
        dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: "Lambda Invocations",
            left: [
                new cloudwatch.Metric({
                    namespace: "AWS/Lambda",
                    metricName: "Invocations",
                    statistic: "Sum",
                    period: cdk.Duration.minutes(5),
                }),
            ],
        }));
        // Lambda Errors Widget
        dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: "Lambda Errors",
            left: [
                new cloudwatch.Metric({
                    namespace: "AWS/Lambda",
                    metricName: "Errors",
                    statistic: "Sum",
                    period: cdk.Duration.minutes(5),
                }),
            ],
        }));
        // Lambda Duration Widget
        dashboard.addWidgets(new cloudwatch.GraphWidget({
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
        }));
        // API Gateway Metrics Widget
        dashboard.addWidgets(new cloudwatch.GraphWidget({
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
        }));
        // Custom Metrics Widget (if available)
        dashboard.addWidgets(new cloudwatch.GraphWidget({
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
        }));
    }
}
exports.MonitoringStack = MonitoringStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3Jpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUl6RCxNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixpQ0FBaUM7UUFDakMsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBYSxDQUFDO1FBRXBGLGlFQUFpRTtRQUNqRSxvREFBb0Q7UUFFcEQsdUJBQXVCO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDckUsYUFBYSxFQUFFLDhCQUE4QjtTQUM5QyxDQUFDLENBQUM7UUFFSCw0QkFBNEI7UUFDNUIsU0FBUyxDQUFDLFVBQVUsQ0FDbEIsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ3pCLEtBQUssRUFBRSxvQkFBb0I7WUFDM0IsSUFBSSxFQUFFO2dCQUNKLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDcEIsU0FBUyxFQUFFLFlBQVk7b0JBQ3ZCLFVBQVUsRUFBRSxhQUFhO29CQUN6QixTQUFTLEVBQUUsS0FBSztvQkFDaEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDaEMsQ0FBQzthQUNIO1NBQ0YsQ0FBQyxDQUNILENBQUM7UUFFRix1QkFBdUI7UUFDdkIsU0FBUyxDQUFDLFVBQVUsQ0FDbEIsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ3pCLEtBQUssRUFBRSxlQUFlO1lBQ3RCLElBQUksRUFBRTtnQkFDSixJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7b0JBQ3BCLFNBQVMsRUFBRSxZQUFZO29CQUN2QixVQUFVLEVBQUUsUUFBUTtvQkFDcEIsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQ2hDLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FDSCxDQUFDO1FBRUYseUJBQXlCO1FBQ3pCLFNBQVMsQ0FBQyxVQUFVLENBQ2xCLElBQUksVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUN6QixLQUFLLEVBQUUsaUJBQWlCO1lBQ3hCLElBQUksRUFBRTtnQkFDSixJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7b0JBQ3BCLFNBQVMsRUFBRSxZQUFZO29CQUN2QixVQUFVLEVBQUUsVUFBVTtvQkFDdEIsU0FBUyxFQUFFLFNBQVM7b0JBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQ2hDLENBQUM7Z0JBQ0YsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUNwQixTQUFTLEVBQUUsWUFBWTtvQkFDdkIsVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLFNBQVMsRUFBRSxLQUFLO29CQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNoQyxDQUFDO2dCQUNGLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDcEIsU0FBUyxFQUFFLFlBQVk7b0JBQ3ZCLFVBQVUsRUFBRSxVQUFVO29CQUN0QixTQUFTLEVBQUUsS0FBSztvQkFDaEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDaEMsQ0FBQzthQUNIO1NBQ0YsQ0FBQyxDQUNILENBQUM7UUFFRiw2QkFBNkI7UUFDN0IsU0FBUyxDQUFDLFVBQVUsQ0FDbEIsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ3pCLEtBQUssRUFBRSxxQkFBcUI7WUFDNUIsSUFBSSxFQUFFO2dCQUNKLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDcEIsU0FBUyxFQUFFLGdCQUFnQjtvQkFDM0IsVUFBVSxFQUFFLE9BQU87b0JBQ25CLFNBQVMsRUFBRSxLQUFLO29CQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNoQyxDQUFDO2dCQUNGLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDcEIsU0FBUyxFQUFFLGdCQUFnQjtvQkFDM0IsVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLFNBQVMsRUFBRSxLQUFLO29CQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNoQyxDQUFDO2dCQUNGLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDcEIsU0FBUyxFQUFFLGdCQUFnQjtvQkFDM0IsVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLFNBQVMsRUFBRSxLQUFLO29CQUNoQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNoQyxDQUFDO2FBQ0g7U0FDRixDQUFDLENBQ0gsQ0FBQztRQUVGLHVDQUF1QztRQUN2QyxTQUFTLENBQUMsVUFBVSxDQUNsQixJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUM7WUFDekIsS0FBSyxFQUFFLDRCQUE0QjtZQUNuQyxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUNwQixTQUFTLEVBQUUsa0JBQWtCO29CQUM3QixVQUFVLEVBQUUsb0JBQW9CO29CQUNoQyxTQUFTLEVBQUUsU0FBUztvQkFDcEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDaEMsQ0FBQztnQkFDRixJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7b0JBQ3BCLFNBQVMsRUFBRSxrQkFBa0I7b0JBQzdCLFVBQVUsRUFBRSx1QkFBdUI7b0JBQ25DLFNBQVMsRUFBRSxTQUFTO29CQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNoQyxDQUFDO2dCQUNGLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztvQkFDcEIsU0FBUyxFQUFFLGtCQUFrQjtvQkFDN0IsVUFBVSxFQUFFLDRCQUE0QjtvQkFDeEMsU0FBUyxFQUFFLFNBQVM7b0JBQ3BCLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQ2hDLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBOUhELDBDQThIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2hcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgQXRzU3RhY2sgfSBmcm9tIFwiLi9hdHMtc3RhY2tcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNb25pdG9yaW5nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vIEdldCByZWZlcmVuY2VzIGZyb20gbWFpbiBzdGFja1xyXG4gICAgY29uc3QgYXRzU3RhY2sgPSBjZGsuU3RhY2sub2YodGhpcykubm9kZS50cnlGaW5kQ2hpbGQoXCJBdHNSZXN1bWVTdGFja1wiKSBhcyBBdHNTdGFjaztcclxuICAgIFxyXG4gICAgLy8gVGhpcyB3b3VsZCBuZWVkIHRvIGJlIHBhc3NlZCBhcyBhIHBhcmFtZXRlciBpbiBhIHJlYWwgc2NlbmFyaW9cclxuICAgIC8vIEZvciBub3csIHdlJ2xsIGNyZWF0ZSBhIGJhc2ljIGRhc2hib2FyZCBzdHJ1Y3R1cmVcclxuXHJcbiAgICAvLyBDbG91ZFdhdGNoIERhc2hib2FyZFxyXG4gICAgY29uc3QgZGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsIFwiQXRzUmVzdW1lRGFzaGJvYXJkXCIsIHtcclxuICAgICAgZGFzaGJvYXJkTmFtZTogXCJBVFMtUmVzdW1lLUJ1aWxkZXItRGFzaGJvYXJkXCIsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMYW1iZGEgSW52b2NhdGlvbnMgV2lkZ2V0XHJcbiAgICBkYXNoYm9hcmQuYWRkV2lkZ2V0cyhcclxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xyXG4gICAgICAgIHRpdGxlOiBcIkxhbWJkYSBJbnZvY2F0aW9uc1wiLFxyXG4gICAgICAgIGxlZnQ6IFtcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJBV1MvTGFtYmRhXCIsXHJcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IFwiSW52b2NhdGlvbnNcIixcclxuICAgICAgICAgICAgc3RhdGlzdGljOiBcIlN1bVwiLFxyXG4gICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgXSxcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gTGFtYmRhIEVycm9ycyBXaWRnZXRcclxuICAgIGRhc2hib2FyZC5hZGRXaWRnZXRzKFxyXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XHJcbiAgICAgICAgdGl0bGU6IFwiTGFtYmRhIEVycm9yc1wiLFxyXG4gICAgICAgIGxlZnQ6IFtcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJBV1MvTGFtYmRhXCIsXHJcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IFwiRXJyb3JzXCIsXHJcbiAgICAgICAgICAgIHN0YXRpc3RpYzogXCJTdW1cIixcclxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIC8vIExhbWJkYSBEdXJhdGlvbiBXaWRnZXRcclxuICAgIGRhc2hib2FyZC5hZGRXaWRnZXRzKFxyXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XHJcbiAgICAgICAgdGl0bGU6IFwiTGFtYmRhIER1cmF0aW9uXCIsXHJcbiAgICAgICAgbGVmdDogW1xyXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiBcIkFXUy9MYW1iZGFcIixcclxuICAgICAgICAgICAgbWV0cmljTmFtZTogXCJEdXJhdGlvblwiLFxyXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwiQXZlcmFnZVwiLFxyXG4gICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICBuYW1lc3BhY2U6IFwiQVdTL0xhbWJkYVwiLFxyXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiBcIkR1cmF0aW9uXCIsXHJcbiAgICAgICAgICAgIHN0YXRpc3RpYzogXCJwOTVcIixcclxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiBcIkFXUy9MYW1iZGFcIixcclxuICAgICAgICAgICAgbWV0cmljTmFtZTogXCJEdXJhdGlvblwiLFxyXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwicDk5XCIsXHJcbiAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBBUEkgR2F0ZXdheSBNZXRyaWNzIFdpZGdldFxyXG4gICAgZGFzaGJvYXJkLmFkZFdpZGdldHMoXHJcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcclxuICAgICAgICB0aXRsZTogXCJBUEkgR2F0ZXdheSBNZXRyaWNzXCIsXHJcbiAgICAgICAgbGVmdDogW1xyXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiBcIkFXUy9BcGlHYXRld2F5XCIsXHJcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IFwiQ291bnRcIixcclxuICAgICAgICAgICAgc3RhdGlzdGljOiBcIlN1bVwiLFxyXG4gICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xyXG4gICAgICAgICAgICBuYW1lc3BhY2U6IFwiQVdTL0FwaUdhdGV3YXlcIixcclxuICAgICAgICAgICAgbWV0cmljTmFtZTogXCI0WFhFcnJvclwiLFxyXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwiU3VtXCIsXHJcbiAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJBV1MvQXBpR2F0ZXdheVwiLFxyXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiBcIjVYWEVycm9yXCIsXHJcbiAgICAgICAgICAgIHN0YXRpc3RpYzogXCJTdW1cIixcclxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIC8vIEN1c3RvbSBNZXRyaWNzIFdpZGdldCAoaWYgYXZhaWxhYmxlKVxyXG4gICAgZGFzaGJvYXJkLmFkZFdpZGdldHMoXHJcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcclxuICAgICAgICB0aXRsZTogXCJDdXN0b20gQXBwbGljYXRpb24gTWV0cmljc1wiLFxyXG4gICAgICAgIGxlZnQ6IFtcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJBVFNSZXN1bWVCdWlsZGVyXCIsXHJcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IFwicHJvY2Vzc0ZpbGVMYXRlbmN5XCIsXHJcbiAgICAgICAgICAgIHN0YXRpc3RpYzogXCJBdmVyYWdlXCIsXHJcbiAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJBVFNSZXN1bWVCdWlsZGVyXCIsXHJcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IFwiZ2VuZXJhdGVSZXN1bWVMYXRlbmN5XCIsXHJcbiAgICAgICAgICAgIHN0YXRpc3RpYzogXCJBdmVyYWdlXCIsXHJcbiAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJBVFNSZXN1bWVCdWlsZGVyXCIsXHJcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IFwiZ2VuZXJhdGVDb3ZlckxldHRlckxhdGVuY3lcIixcclxuICAgICAgICAgICAgc3RhdGlzdGljOiBcIkF2ZXJhZ2VcIixcclxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbiJdfQ==
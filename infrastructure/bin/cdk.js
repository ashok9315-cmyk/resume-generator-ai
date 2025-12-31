#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const ats_stack_1 = require("../lib/ats-stack");
const monitoring_stack_1 = require("../lib/monitoring-stack");
const logging_stack_1 = require("../lib/logging-stack");
const app = new cdk.App();
const env = app.node.tryGetContext("env") || "production";
const region = process.env.AWS_REGION || "us-east-1";
// Main infrastructure stack
const atsStack = new ats_stack_1.AtsStack(app, `AtsResumeStack-${env}`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
    },
    description: "ATS Resume Builder - Main infrastructure",
});
// Monitoring stack
const monitoringStack = new monitoring_stack_1.MonitoringStack(app, `AtsResumeMonitoringStack-${env}`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
    },
    description: "ATS Resume Builder - Monitoring and dashboards",
});
// Logging stack
const loggingStack = new logging_stack_1.LoggingStack(app, `AtsResumeLoggingStack-${env}`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
    },
    description: "ATS Resume Builder - Logging and alarms",
});
// Add dependencies
monitoringStack.addDependency(atsStack);
loggingStack.addDependency(atsStack);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsZ0RBQTRDO0FBQzVDLDhEQUEwRDtBQUMxRCx3REFBb0Q7QUFFcEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksWUFBWSxDQUFDO0FBQzFELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQztBQUVyRCw0QkFBNEI7QUFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsR0FBRyxFQUFFLEVBQUU7SUFDMUQsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxNQUFNO0tBQ2Y7SUFDRCxXQUFXLEVBQUUsMENBQTBDO0NBQ3hELENBQUMsQ0FBQztBQUVILG1CQUFtQjtBQUNuQixNQUFNLGVBQWUsR0FBRyxJQUFJLGtDQUFlLENBQ3pDLEdBQUcsRUFDSCw0QkFBNEIsR0FBRyxFQUFFLEVBQ2pDO0lBQ0UsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxNQUFNO0tBQ2Y7SUFDRCxXQUFXLEVBQUUsZ0RBQWdEO0NBQzlELENBQ0YsQ0FBQztBQUVGLGdCQUFnQjtBQUNoQixNQUFNLFlBQVksR0FBRyxJQUFJLDRCQUFZLENBQUMsR0FBRyxFQUFFLHlCQUF5QixHQUFHLEVBQUUsRUFBRTtJQUN6RSxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE1BQU07S0FDZjtJQUNELFdBQVcsRUFBRSx5Q0FBeUM7Q0FDdkQsQ0FBQyxDQUFDO0FBRUgsbUJBQW1CO0FBQ25CLGVBQWUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDeEMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVyQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXHJcbmltcG9ydCBcInNvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3RlclwiO1xyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCB7IEF0c1N0YWNrIH0gZnJvbSBcIi4uL2xpYi9hdHMtc3RhY2tcIjtcclxuaW1wb3J0IHsgTW9uaXRvcmluZ1N0YWNrIH0gZnJvbSBcIi4uL2xpYi9tb25pdG9yaW5nLXN0YWNrXCI7XHJcbmltcG9ydCB7IExvZ2dpbmdTdGFjayB9IGZyb20gXCIuLi9saWIvbG9nZ2luZy1zdGFja1wiO1xyXG5cclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbmNvbnN0IGVudiA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoXCJlbnZcIikgfHwgXCJwcm9kdWN0aW9uXCI7XHJcbmNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgXCJ1cy1lYXN0LTFcIjtcclxuXHJcbi8vIE1haW4gaW5mcmFzdHJ1Y3R1cmUgc3RhY2tcclxuY29uc3QgYXRzU3RhY2sgPSBuZXcgQXRzU3RhY2soYXBwLCBgQXRzUmVzdW1lU3RhY2stJHtlbnZ9YCwge1xyXG4gIGVudjoge1xyXG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICAgIHJlZ2lvbjogcmVnaW9uLFxyXG4gIH0sXHJcbiAgZGVzY3JpcHRpb246IFwiQVRTIFJlc3VtZSBCdWlsZGVyIC0gTWFpbiBpbmZyYXN0cnVjdHVyZVwiLFxyXG59KTtcclxuXHJcbi8vIE1vbml0b3Jpbmcgc3RhY2tcclxuY29uc3QgbW9uaXRvcmluZ1N0YWNrID0gbmV3IE1vbml0b3JpbmdTdGFjayhcclxuICBhcHAsXHJcbiAgYEF0c1Jlc3VtZU1vbml0b3JpbmdTdGFjay0ke2Vudn1gLFxyXG4gIHtcclxuICAgIGVudjoge1xyXG4gICAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxyXG4gICAgICByZWdpb246IHJlZ2lvbixcclxuICAgIH0sXHJcbiAgICBkZXNjcmlwdGlvbjogXCJBVFMgUmVzdW1lIEJ1aWxkZXIgLSBNb25pdG9yaW5nIGFuZCBkYXNoYm9hcmRzXCIsXHJcbiAgfVxyXG4pO1xyXG5cclxuLy8gTG9nZ2luZyBzdGFja1xyXG5jb25zdCBsb2dnaW5nU3RhY2sgPSBuZXcgTG9nZ2luZ1N0YWNrKGFwcCwgYEF0c1Jlc3VtZUxvZ2dpbmdTdGFjay0ke2Vudn1gLCB7XHJcbiAgZW52OiB7XHJcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxyXG4gICAgcmVnaW9uOiByZWdpb24sXHJcbiAgfSxcclxuICBkZXNjcmlwdGlvbjogXCJBVFMgUmVzdW1lIEJ1aWxkZXIgLSBMb2dnaW5nIGFuZCBhbGFybXNcIixcclxufSk7XHJcblxyXG4vLyBBZGQgZGVwZW5kZW5jaWVzXHJcbm1vbml0b3JpbmdTdGFjay5hZGREZXBlbmRlbmN5KGF0c1N0YWNrKTtcclxubG9nZ2luZ1N0YWNrLmFkZERlcGVuZGVuY3koYXRzU3RhY2spO1xyXG5cclxuYXBwLnN5bnRoKCk7XHJcblxyXG5cclxuIl19
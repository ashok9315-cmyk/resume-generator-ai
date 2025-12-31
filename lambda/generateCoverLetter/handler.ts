import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import logger from "./logger";
import { captureAsync, addMetadata } from "./xray";
import { recordLatency, recordError } from "./metrics";
import { generateCoverLetter } from "./index";

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Handler for API Gateway events (backward compatibility)
async function handleAPIGatewayEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId || generateUUID();
  const startTime = Date.now();

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://resume-generator-ai.solutionsynth.cloud",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "x-request-id": requestId,
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  return captureAsync("generateCoverLetterHandler", async () => {
    try {
      logger.info("Generate cover letter request received", {
        requestId,
        path: event.path,
      });

      addMetadata("requestId", requestId);

      const body = JSON.parse(event.body || "{}");
      const { jobDescription, resumeText, tone, length } = body;

      if (!jobDescription || !resumeText) {
        throw new Error("Missing required fields: jobDescription, resumeText");
      }

      const refined = await generateCoverLetter(
        jobDescription,
        resumeText,
        tone || "professional",
        length || "medium",
        requestId
      );

      const duration = Date.now() - startTime;
      await recordLatency("generateCoverLetter", duration, { requestId });

      logger.info("Generate cover letter request completed", {
        requestId,
        duration,
        refinedLength: refined.length,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            refined,
            requestId,
          },
        }),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await recordError("generateCoverLetter", "GENERATION_ERROR", {
        requestId,
      });

      logger.error("Generate cover letter request failed", {
        requestId,
        error: errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        duration,
      });

      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          requestId,
        }),
      };
    }
  });
}

// Handler for direct Function URL invocation
async function handleDirectInvocation(event: any): Promise<any> {
  const requestId = event.requestContext?.requestId || generateUUID();
  const startTime = Date.now();

  return captureAsync("generateCoverLetterDirectHandler", async () => {
    try {
      logger.info("Direct cover letter generation request received", {
        requestId,
        method: event.requestContext.http.method,
        userAgent: event.headers?.['user-agent'],
      });

      addMetadata("requestId", requestId);

      // Handle CORS preflight
      if (event.requestContext.http.method === 'OPTIONS') {
        return {
          statusCode: 200,
          body: "",
        };
      }

      if (event.requestContext.http.method !== 'POST') {
        return {
          statusCode: 405,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: false,
            error: "Method not allowed. Use POST.",
          }),
        };
      }

      const body = JSON.parse(event.body || "{}");
      const { jobDescription, resumeText, tone, length } = body;

      if (!jobDescription || !resumeText) {
        throw new Error("Missing required fields: jobDescription, resumeText");
      }

      logger.info("Starting direct cover letter generation", {
        requestId,
        jobDescriptionLength: jobDescription.length,
        resumeTextLength: resumeText.length,
        tone,
        length,
      });

      const refined = await generateCoverLetter(
        jobDescription,
        resumeText,
        tone || "professional",
        length || "medium",
        requestId
      );

      const duration = Date.now() - startTime;
      await recordLatency("generateCoverLetter", duration, { requestId });

      logger.info("Direct cover letter generation completed", {
        requestId,
        duration,
        refinedLength: refined.length,
      });

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
        body: JSON.stringify({
          success: true,
          data: {
            refined,
            requestId,
            processingTime: duration,
          },
        }),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await recordError("generateCoverLetter", "GENERATION_ERROR", {
        requestId,
      });

      logger.error("Direct cover letter generation failed", {
        requestId,
        error: errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        duration,
      });

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          requestId,
        }),
      };
    }
  });
}

// Main handler
export const handler = async (
  event: any
): Promise<any> => {
  // Handle Function URL requests (HTTP-like events)
  if (event.requestContext && event.requestContext.http) {
    return handleDirectInvocation(event);
  }
  
  // Handle API Gateway events (backward compatibility)
  return handleAPIGatewayEvent(event as APIGatewayProxyEvent);
};
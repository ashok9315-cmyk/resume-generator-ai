import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import logger from "./logger";
import { captureAsync, addMetadata } from "./xray";
import { recordLatency, recordError } from "./metrics";
import { generateResume } from "./index";

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

  return captureAsync("generateResumeHandler", async () => {
    try {
      logger.info("Generate resume request received", {
        requestId,
        path: event.path,
      });

      addMetadata("requestId", requestId);

      const body = JSON.parse(event.body || "{}");
      const { text } = body;

      if (!text) {
        throw new Error("Missing required field: text");
      }

      const formatted = await generateResume(text, requestId);

      const duration = Date.now() - startTime;
      await recordLatency("generateResume", duration, { requestId });

      logger.info("Generate resume request completed", {
        requestId,
        duration,
        formattedLength: formatted.length,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            formatted,
            requestId,
          },
        }),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await recordError("generateResume", "GENERATION_ERROR", { requestId });

      logger.error("Generate resume request failed", {
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

  return captureAsync("generateResumeDirectHandler", async () => {
    try {
      logger.info("Direct resume generation request received", {
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
      const { text, template } = body;

      if (!text) {
        throw new Error("Missing required field: text");
      }

      logger.info("Starting direct resume generation", {
        requestId,
        textLength: text.length,
        template,
      });

      const formatted = await generateResume(text, requestId);

      const duration = Date.now() - startTime;
      await recordLatency("generateResume", duration, { requestId });

      logger.info("Direct resume generation completed", {
        requestId,
        duration,
        formattedLength: formatted.length,
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
            formatted,
            requestId,
            processingTime: duration,
          },
        }),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await recordError("generateResume", "GENERATION_ERROR", {
        requestId,
      });

      logger.error("Direct resume generation failed", {
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
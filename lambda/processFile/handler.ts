import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import logger from "./logger";
import { captureAsync, addMetadata } from "./xray";
import { recordLatency, recordError } from "./metrics";
import { extractTextFromFile } from "./index";

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

  return captureAsync("processFileHandler", async () => {
    try {
      logger.info("Process file request received", {
        requestId,
        path: event.path,
      });

      addMetadata("requestId", requestId);

      const body = JSON.parse(event.body || "{}");
      const { s3Key, fileType } = body;

      if (!s3Key || !fileType) {
        throw new Error("Missing required fields: s3Key, fileType");
      }

      const text = await extractTextFromFile(s3Key, fileType);

      const duration = Date.now() - startTime;
      await recordLatency("processFile", duration, { requestId });

      logger.info("Process file request completed", {
        requestId,
        duration,
        textLength: text.length,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            text,
            requestId,
          },
        }),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await recordError("processFile", "EXTRACTION_ERROR", { requestId });

      logger.error("Process file request failed", {
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
};



import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import logger from "@/lib/logging/winston";

export function loggingMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Add request ID to headers
  request.headers.set("x-request-id", requestId);

  logger.info("API request received", {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get("user-agent") || undefined,
    ip: request.headers.get("x-forwarded-for") || request.ip || undefined,
  });

  return handler(request)
    .then((response) => {
      const duration = Date.now() - startTime;
      logger.info("API request completed", {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        status: response.status,
        duration,
      });
      response.headers.set("x-request-id", requestId);
      return response;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      logger.error("API request failed", {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined,
        duration,
      });
      throw error;
    });
}



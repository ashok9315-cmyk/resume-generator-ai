import { NextResponse } from "next/server";
import logger from "@/lib/logging/winston";

export interface AppError extends Error {
  statusCode?: number;
  errorType?: string;
  context?: Record<string, unknown>;
}

export class UserError extends Error implements AppError {
  statusCode = 400;
  errorType = "USER_ERROR";
  context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "UserError";
    this.context = context;
  }
}

export class SystemError extends Error implements AppError {
  statusCode = 500;
  errorType = "SYSTEM_ERROR";
  context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "SystemError";
    this.context = context;
  }
}

export class AIError extends Error implements AppError {
  statusCode = 502;
  errorType = "AI_ERROR";
  context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "AIError";
    this.context = context;
  }
}

export function handleError(error: unknown, requestId?: string): NextResponse {
  let appError: AppError;

  if (error instanceof UserError || error instanceof SystemError || error instanceof AIError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new SystemError(error.message, { originalError: error.name });
  } else {
    appError = new SystemError("An unknown error occurred");
  }

  logger.error("Error handled", {
    requestId,
    errorType: appError.errorType,
    errorMessage: appError.message,
    stackTrace: appError.stack,
    context: appError.context,
  });

  return NextResponse.json(
    {
      success: false,
      error: appError.message,
      errorType: appError.errorType,
      requestId,
    },
    { status: appError.statusCode || 500 }
  );
}



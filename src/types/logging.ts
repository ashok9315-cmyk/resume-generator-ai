export type LogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";

export interface LogMetadata {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface RequestLog {
  requestId: string;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
}

export interface AILog {
  requestId: string;
  operation: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  duration: number;
  cost?: number;
  langsmithRunId?: string;
}

export interface ErrorLog {
  requestId: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
}

export interface PerformanceLog {
  requestId: string;
  metric: string;
  duration: number;
  memoryUsed?: number;
  memoryTotal?: number;
}



// Simplified metrics for Lambda
export async function recordLatency(operation: string, duration: number, metadata?: any) {
  console.log(`METRIC: ${operation} duration: ${duration}ms`, metadata);
}

export async function recordError(operation: string, errorType: string, metadata?: any) {
  console.log(`ERROR_METRIC: ${operation} error: ${errorType}`, metadata);
}
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
): Promise<RetryResult<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt === options.maxRetries + 1) {
        break;
      }
      
      // Check if it's a timeout error that we should retry
      const isTimeoutError = lastError.message.includes('504') || 
                           lastError.message.includes('timeout') ||
                           lastError.message.includes('Gateway Timeout');
      
      if (!isTimeoutError) {
        // Don't retry non-timeout errors
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1),
        options.maxDelay
      );
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    attempts: options.maxRetries + 1
  };
}

export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || String(error);
  
  // Retry on timeout errors
  if (errorMessage.includes('504') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('Gateway Timeout')) {
    return true;
  }
  
  // Retry on network errors
  if (errorMessage.includes('fetch') || 
      errorMessage.includes('network') ||
      errorMessage.includes('ECONNRESET')) {
    return true;
  }
  
  return false;
}
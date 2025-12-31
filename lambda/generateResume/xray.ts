// Simplified X-Ray for Lambda
export async function captureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  console.log(`XRAY: Starting ${name}`);
  try {
    const result = await fn();
    console.log(`XRAY: Completed ${name}`);
    return result;
  } catch (error) {
    console.log(`XRAY: Error in ${name}`, error);
    throw error;
  }
}

export function addMetadata(key: string, value: any) {
  console.log(`XRAY_METADATA: ${key}=${value}`);
}
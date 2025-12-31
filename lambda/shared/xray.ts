import * as AWSXRay from "aws-xray-sdk-core";

let xrayEnabled = false;

export function initializeXRay() {
  if (process.env.ENABLE_XRAY_TRACING === "true") {
    try {
      AWSXRay.setContextMissingStrategy("LOG_ERROR");
      AWSXRay.captureAWS(require("aws-sdk"));
      xrayEnabled = true;
    } catch (error) {
      console.error("Failed to initialize X-Ray:", error);
    }
  }
}

export function captureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!xrayEnabled) {
    return fn();
  }

  return AWSXRay.captureAsyncFunc(name, async (subsegment) => {
    try {
      const result = await fn();
      if (subsegment) {
        subsegment.close();
      }
      return result;
    } catch (error) {
      if (subsegment) {
        subsegment.addError(error as Error);
        subsegment.close();
      }
      throw error;
    }
  });
}

export function addMetadata(key: string, value: unknown) {
  if (!xrayEnabled) return;

  const segment = AWSXRay.getSegment();
  if (segment) {
    segment.addMetadata(key, value);
  }
}

export function addAnnotation(key: string, value: string | number | boolean) {
  if (!xrayEnabled) return;

  const segment = AWSXRay.getSegment();
  if (segment) {
    segment.addAnnotation(key, value);
  }
}

// Initialize on import
initializeXRay();



import * as AWSXRay from "aws-xray-sdk-core";

let xrayEnabled = false;

export function initializeXRay() {
  if (process.env.ENABLE_XRAY_TRACING === "true") {
    try {
      AWSXRay.setContextMissingStrategy("LOG_ERROR");
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

  return new Promise((resolve, reject) => {
    const segment = AWSXRay.getSegment();
    if (!segment) {
      return fn().then(resolve).catch(reject);
    }

    const subsegment = segment.addNewSubsegment(name);
    fn()
      .then((result) => {
        subsegment.close();
        resolve(result);
      })
      .catch((error) => {
        subsegment.addError(error);
        subsegment.close();
        reject(error);
      });
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



import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import logger from "./logger";

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || "us-east-1" });

export async function putMetric(
  namespace: string,
  metricName: string,
  value: number,
  unit: "Count" | "Milliseconds" | "Bytes" = "Count",
  dimensions?: Record<string, string>
) {
  try {
    const command = new PutMetricDataCommand({
      Namespace: namespace,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Dimensions: dimensions
            ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
            : undefined,
        },
      ],
    });

    await cloudwatch.send(command);
  } catch (error) {
    logger.error("Failed to put metric", {
      namespace,
      metricName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function recordLatency(
  operation: string,
  duration: number,
  dimensions?: Record<string, string>
) {
  await putMetric(
    "ATSResumeBuilder",
    `${operation}Latency`,
    duration,
    "Milliseconds",
    dimensions
  );
}

export async function recordError(
  operation: string,
  errorType: string,
  dimensions?: Record<string, string>
) {
  await putMetric(
    "ATSResumeBuilder",
    `${operation}Errors`,
    1,
    "Count",
    { ...dimensions, errorType }
  );
}



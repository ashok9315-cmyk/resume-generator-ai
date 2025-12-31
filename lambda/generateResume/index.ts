import { ResumeGenerator } from "./workflow";
import logger from "./logger";
import { captureAsync } from "./xray";

export async function generateResume(
  rawText: string,
  requestId: string
): Promise<string> {
  return captureAsync("generateResume", async () => {
    logger.info("Resume generation started", {
      requestId,
      textLength: rawText.length,
    });

    const generator = new ResumeGenerator();
    const formatted = await generator.generateResume(rawText);

    logger.info("Resume generation completed", {
      requestId,
      formattedLength: formatted.length,
    });

    return formatted;
  });
}



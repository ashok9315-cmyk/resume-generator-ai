import { CoverLetterGenerator } from "./workflow";
import logger from "./logger";
import { captureAsync } from "./xray";

export async function generateCoverLetter(
  jobDescription: string,
  resumeText: string,
  tone: string,
  length: string,
  requestId: string
): Promise<string> {
  return captureAsync("generateCoverLetter", async () => {
    logger.info("Cover letter generation started", {
      requestId,
      jobDescriptionLength: jobDescription.length,
      resumeTextLength: resumeText.length,
      tone,
      length,
    });

    const generator = new CoverLetterGenerator();
    const refined = await generator.generateCoverLetter(
      jobDescription,
      resumeText,
      tone,
      length
    );

    logger.info("Cover letter generation completed", {
      requestId,
      refinedLength: refined.length,
    });

    return refined;
  });
}



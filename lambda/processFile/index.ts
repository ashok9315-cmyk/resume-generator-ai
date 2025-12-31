import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import logger from "./logger";
import { captureAsync } from "./xray";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const uploadBucket = process.env.AWS_S3_UPLOAD_BUCKET || "";

async function getObjectFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: uploadBucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks: Uint8Array[] = [];

  if (response.Body) {
    const stream = response.Body as any;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

export async function extractTextFromFile(
  s3Key: string,
  fileType: string
): Promise<string> {
  return captureAsync("extractText", async () => {
    logger.info("Extracting text from file", {
      s3Key,
      fileType,
    });

    const fileBuffer = await getObjectFromS3(s3Key);

    let text: string;

    if (fileType === "application/pdf") {
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    logger.info("Text extraction completed", {
      s3Key,
      fileType,
      textLength: text.length,
    });

    return text;
  });
}

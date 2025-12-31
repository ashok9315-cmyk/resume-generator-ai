import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const uploadBucket = process.env.AWS_S3_UPLOAD_BUCKET || "";

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: uploadBucket,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function getObjectFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: uploadBucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks: Uint8Array[] = [];

  if (response.Body) {
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

export async function deleteObjectFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: uploadBucket,
    Key: key,
  });

  await s3Client.send(command);
}



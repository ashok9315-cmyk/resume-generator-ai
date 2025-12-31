import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const uploadBucket = process.env.AWS_S3_UPLOAD_BUCKET || "";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId || uuidv4();

  console.log("Upload request received", {
    requestId,
    path: event.path,
    method: event.httpMethod,
  });

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://resume-generator-ai.solutionsynth.cloud",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "x-request-id": requestId,
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const { fileName, fileType, fileSize } = JSON.parse(event.body);

    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "fileName and fileType are required" }),
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileSize && fileSize > maxSize) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "File size exceeds 5MB limit" }),
      };
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(fileType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid file type. Only PDF and DOCX are allowed" }),
      };
    }

    // Generate unique S3 key
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uniqueId = uuidv4().substring(0, 8);
    const fileExtension = fileName.split(".").pop();
    const s3Key = `uploads/${timestamp}-${uniqueId}.${fileExtension}`;

    // Generate presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: uploadBucket,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    console.log("Generated presigned URL successfully", {
      requestId,
      s3Key,
      fileName,
      fileType,
      fileSize,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl,
        s3Key,
        message: "Presigned URL generated successfully",
      }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("Upload request failed", {
      requestId,
      error: errorMessage,
      stackTrace: error instanceof Error ? error.stack : undefined,
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to generate upload URL",
        details: errorMessage,
      }),
    };
  }
};
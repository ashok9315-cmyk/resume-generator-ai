"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUpload as FileUploadType } from "@/types";

interface FileUploadProps {
  onUploadComplete: (file: FileUploadType) => void;
  onError: (error: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

export default function FileUpload({
  onUploadComplete,
  onError,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        onError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        // Generate presigned URL using API Gateway
        const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://nkxintctea.execute-api.us-east-1.amazonaws.com/prod';
        const response = await fetch(`${apiGatewayUrl}/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl, s3Key } = await response.json();

        // Upload to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        setUploadProgress(100);

        const fileUpload: FileUploadType = {
          file,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          s3Key,
        };

        onUploadComplete(fileUpload);
      } catch (error) {
        onError(
          error instanceof Error ? error.message : "Upload failed"
        );
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [onUploadComplete, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-2">
            <div className="text-lg font-medium">Uploading...</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{uploadProgress}%</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-lg font-medium">
              {isDragActive
                ? "Drop the file here"
                : "Drag & drop your resume here"}
            </div>
            <div className="text-sm text-gray-500">
              or click to select a file
            </div>
            <div className="text-xs text-gray-400">
              PDF or DOCX up to 5MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



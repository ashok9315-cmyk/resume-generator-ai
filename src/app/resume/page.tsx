"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import ResumePreview from "@/components/ResumePreview";
import TemplateSelector from "@/components/TemplateSelector";
import PDFExport from "@/components/PDFExport";
import ProgressIndicator from "@/components/ProgressIndicator";
import { FileUpload as FileUploadType } from "@/types";

export default function ResumePage() {
  const [file, setFile] = useState<FileUploadType | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [generatedResume, setGeneratedResume] = useState<string>("");
  const [template, setTemplate] = useState<string>("modern");
  const [loading, setLoading] = useState(false);
  const [processingType, setProcessingType] = useState<"file-processing" | "resume" | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = async (uploadedFile: FileUploadType) => {
    setFile(uploadedFile);
    setError(null);

    // Extract text from file
    try {
      setLoading(true);
      setProcessingType("file-processing");
      
      // Use API Gateway for file processing (still needed)
      const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://nkxintctea.execute-api.us-east-1.amazonaws.com/prod';
      const response = await fetch(`${apiGatewayUrl}/process-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          s3Key: uploadedFile.s3Key,
          fileType: uploadedFile.fileType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process file");
      }

      const data = await response.json();
      setResumeText(data.data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setLoading(false);
      setProcessingType(null);
    }
  };

  const handleGenerate = async () => {
    if (!resumeText) {
      setError("Please upload a resume first");
      return;
    }

    try {
      setLoading(true);
      setProcessingType("resume");
      setJobProgress(0);
      setJobStatus("Starting resume generation...");
      setError(null);

      setJobProgress(20);
      setJobStatus("Calling Lambda Function directly...");

      // Use direct Lambda Function URL for all requests
      const resumeFunctionUrl = process.env.NEXT_PUBLIC_RESUME_FUNCTION_URL || 'https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/';
      const response = await fetch(resumeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: resumeText,
          template,
        }),
      });

      setJobProgress(80);
      setJobStatus("Processing response...");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate resume");
      }

      const data = await response.json();
      setGeneratedResume(data.data.formatted);
      setJobProgress(100);
      setJobStatus("Completed!");
      
      // Show success message briefly
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate resume");
    } finally {
      setLoading(false);
      setProcessingType(null);
      setJobProgress(0);
      setJobStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Generator</h1>
          <p className="mt-2 text-gray-600">
            Upload your resume and generate an ATS-optimized version
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload Resume</h2>
              <FileUpload
                onUploadComplete={handleUploadComplete}
                onError={setError}
              />
              
              {file && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ {file.fileName} uploaded successfully
                  </p>
                </div>
              )}
            </div>

            {resumeText && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Template</h2>
                <TemplateSelector
                  selectedTemplate={template}
                  onTemplateChange={setTemplate}
                />
              </div>
            )}

            {resumeText && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {processingType === "resume" ? "Generating Resume..." : "Processing..."}
                      </span>
                    </>
                  ) : (
                    "Generate ATS-Optimized Resume"
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-700 font-medium">Resume generated successfully!</p>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            {loading && processingType && (
              <ProgressIndicator
                isVisible={loading}
                type={processingType}
                estimatedDuration={processingType === "resume" ? (resumeText.length > 5000 ? 90 : 40) : 10}
                progress={jobProgress}
                status={jobStatus}
              />
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {generatedResume ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
                  <PDFExport htmlContent={generatedResume} />
                </div>
                <ResumePreview htmlContent={generatedResume} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Resume Preview
                </h3>
                <p className="text-gray-600">
                  Upload a resume to see the ATS-optimized version here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



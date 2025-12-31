"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import ProgressIndicator from "@/components/ProgressIndicator";
import { FileUpload as FileUploadType } from "@/types";

export default function CoverLetterPage() {
  const [file, setFile] = useState<FileUploadType | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [tone, setTone] = useState<string>("professional");
  const [length, setLength] = useState<string>("medium");
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processingType, setProcessingType] = useState<"file-processing" | "cover-letter" | null>(null);
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
    if (!resumeText || !jobDescription) {
      setError("Please upload a resume and enter a job description");
      return;
    }

    try {
      setLoading(true);
      setProcessingType("cover-letter");
      setJobProgress(0);
      setJobStatus("Starting cover letter generation...");
      setError(null);

      setJobProgress(20);
      setJobStatus("Calling Lambda Function directly...");

      // Use direct Lambda Function URL for all requests
      const coverLetterFunctionUrl = process.env.NEXT_PUBLIC_COVER_LETTER_FUNCTION_URL || 'https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/';
      const response = await fetch(coverLetterFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          resumeText,
          tone,
          length,
        }),
      });

      setJobProgress(80);
      setJobStatus("Processing response...");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate cover letter");
      }

      const data = await response.json();
      setGeneratedCoverLetter(data.data.refined);
      setJobProgress(100);
      setJobStatus("Completed!");
      
      // Show success message briefly
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate cover letter"
      );
    } finally {
      setLoading(false);
      setProcessingType(null);
      setJobProgress(0);
      setJobStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cover Letter Generator</h1>
          <p className="mt-2 text-gray-600">
            Upload your resume and job description to generate a tailored cover letter
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
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

            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Paste the job description here..."
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={handleGenerate}
                disabled={loading || !resumeText || !jobDescription}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {processingType === "cover-letter" ? "Generating Cover Letter..." : "Processing..."}
                    </span>
                  </>
                ) : (
                  "Generate Cover Letter"
                )}
              </button>
            </div>

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
                  <p className="text-green-700 font-medium">Cover letter generated successfully!</p>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            {loading && processingType && (
              <ProgressIndicator
                isVisible={loading}
                type={processingType}
                estimatedDuration={processingType === "cover-letter" ? 35 : 10}
                progress={jobProgress}
                status={jobStatus}
              />
            )}
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {generatedCoverLetter ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Generated Cover Letter</h2>
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedCoverLetter], {
                        type: "text/html",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "cover-letter.html";
                      a.click();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download
                  </button>
                </div>
                <div
                  className="prose max-w-none bg-gray-50 p-6 rounded-lg border"
                  dangerouslySetInnerHTML={{ __html: generatedCoverLetter }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Cover Letter Preview
                </h3>
                <p className="text-gray-600">
                  Upload your resume and add a job description to generate a tailored cover letter
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



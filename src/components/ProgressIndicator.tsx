"use client";

import { useEffect, useState } from "react";

interface ProgressIndicatorProps {
  isVisible: boolean;
  type: "resume" | "cover-letter" | "file-processing";
  estimatedDuration?: number; // in seconds
  retryAttempt?: number; // current retry attempt (for backward compatibility)
  progress?: number; // async job progress (0-100)
  status?: string; // async job status message
}

const progressSteps = {
  "file-processing": [
    { label: "Uploading file...", duration: 2 },
    { label: "Extracting text...", duration: 3 },
    { label: "Processing content...", duration: 2 },
  ],
  resume: [
    { label: "Analyzing resume content...", duration: 5 },
    { label: "Selecting optimal AI model...", duration: 2 },
    { label: "Generating ATS-optimized format...", duration: 15 },
    { label: "Enhancing keywords and structure...", duration: 10 },
    { label: "Finalizing professional layout...", duration: 8 },
  ],
  "cover-letter": [
    { label: "Analyzing job requirements...", duration: 3 },
    { label: "Matching resume to job description...", duration: 5 },
    { label: "Generating personalized content...", duration: 12 },
    { label: "Optimizing tone and structure...", duration: 8 },
    { label: "Finalizing cover letter...", duration: 5 },
  ],
};

export default function ProgressIndicator({ 
  isVisible, 
  type, 
  estimatedDuration,
  retryAttempt = 0,
  progress: asyncProgress,
  status: asyncStatus
}: ProgressIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const steps = progressSteps[type];
  const totalEstimatedTime = estimatedDuration || steps.reduce((sum, step) => sum + step.duration, 0);

  // Use async progress if available, otherwise fall back to time-based progress
  const displayProgress = asyncProgress !== undefined ? asyncProgress : progress;
  const displayStatus = asyncStatus || (currentStep < steps.length ? steps[currentStep].label : "Processing...");

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newElapsed = prev + 0.5;
        
        // Calculate which step we should be on
        let accumulatedTime = 0;
        let newCurrentStep = 0;
        
        for (let i = 0; i < steps.length; i++) {
          accumulatedTime += steps[i].duration;
          if (newElapsed < accumulatedTime) {
            newCurrentStep = i;
            break;
          }
          newCurrentStep = i + 1;
        }
        
        setCurrentStep(Math.min(newCurrentStep, steps.length - 1));
        
        // Calculate overall progress (cap at 95% until completion)
        const calculatedProgress = Math.min((newElapsed / totalEstimatedTime) * 100, 95);
        setProgress(calculatedProgress);
        
        return newElapsed;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, steps, totalEstimatedTime]);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {type === "file-processing" && "Processing File"}
          {type === "resume" && "Generating Resume"}
          {type === "cover-letter" && "Generating Cover Letter"}
          {retryAttempt > 0 && (
            <span className="ml-2 text-sm font-normal text-orange-600">
              (Retry {retryAttempt})
            </span>
          )}
        </h3>
        <div className="text-sm text-gray-500">
          {formatTime(elapsedTime)} / ~{formatTime(totalEstimatedTime)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(displayProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              displayProgress >= 100 ? "bg-gradient-to-r from-blue-600 to-green-500" : "bg-blue-600"
            }`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      {/* Current Status */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3 text-sm text-blue-600 font-medium">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <span>{displayStatus}</span>
        </div>
        
        {/* Processing Mode Indicator */}
        {(type === "resume" || type === "cover-letter") && displayStatus.includes("sync") && (
          <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Fast sync processing (small input)</span>
          </div>
        )}
        
        {(type === "resume" || type === "cover-letter") && displayStatus.includes("async") && (
          <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span>Advanced async processing (large input)</span>
          </div>
        )}
        
        {/* Show steps for file processing (non-async) */}
        {type === "file-processing" && steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 text-sm ${
              index === currentStep
                ? "text-blue-600 font-medium"
                : index < currentStep
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                index === currentStep
                  ? "bg-blue-600 animate-pulse"
                  : index < currentStep
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            />
            <span>{step.label}</span>
          </div>
        ))}

        {/* Show detailed steps for async jobs (resume/cover-letter) */}
        {(type === "resume" || type === "cover-letter") && steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 text-sm ${
              index === currentStep
                ? "text-blue-600 font-medium"
                : index < currentStep
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            <div className="flex-shrink-0">
              {index < currentStep ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : index === currentStep ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
              )}
            </div>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {/* AI Model Info for Resume */}
      {type === "resume" && currentStep >= 1 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">AI Model:</span> Using{" "}
            {elapsedTime > 10 ? "Claude Sonnet 4.5" : "Claude 3.5 Haiku"} for optimal results
          </p>
        </div>
      )}

      {/* Retry Info */}
      {retryAttempt > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">
            <span className="font-medium">Retry {retryAttempt}:</span> Previous attempt timed out, retrying with optimized settings...
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong>{" "}
          {type === "resume" && "Larger resumes may take longer for comprehensive optimization"}
          {type === "cover-letter" && "Detailed job descriptions create more personalized letters"}
          {type === "file-processing" && "PDF files may take a moment to extract text"}
        </p>
      </div>
    </div>
  );
}
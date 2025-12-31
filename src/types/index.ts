export interface ResumeData {
  rawText: string;
  sections: Record<string, string>;
  optimized: string;
  formatted: string;
  requestId: string;
}

export interface CoverLetterData {
  jobDescription: string;
  resumeData: ResumeData;
  tone?: "professional" | "casual" | "enthusiastic";
  length?: "short" | "medium" | "long";
  generated?: string;
  requestId: string;
}

export interface FileUpload {
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadId?: string;
  s3Key?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface ResumeGenerationRequest {
  text: string;
  template?: string;
  requestId: string;
}

export interface CoverLetterGenerationRequest {
  jobDescription: string;
  resumeText: string;
  tone?: string;
  length?: string;
  requestId: string;
}



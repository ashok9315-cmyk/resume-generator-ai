export interface JobRequest {
  jobType: 'resume' | 'cover-letter';
  jobId: string;
  requestId: string;
  data: {
    text?: string;
    template?: string;
    jobDescription?: string;
    resumeText?: string;
    tone?: string;
    length?: string;
  };
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  jobType: 'resume' | 'cover-letter';
  createdAt: string;
  updatedAt: string;
  result?: {
    formatted?: string;
    refined?: string;
  };
  error?: string;
  ttl: number; // TTL for DynamoDB auto-deletion (7 days)
}
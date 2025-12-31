"use client";

interface ResumePreviewProps {
  htmlContent: string;
}

export default function ResumePreview({ htmlContent }: ResumePreviewProps) {
  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-8">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}



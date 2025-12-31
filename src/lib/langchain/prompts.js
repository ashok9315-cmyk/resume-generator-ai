"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COVER_LETTER_REFINEMENT_PROMPT = exports.COVER_LETTER_PERSONALIZATION_PROMPT = exports.COVER_LETTER_MATCHING_PROMPT = exports.RESUME_FORMAT_PROMPT = exports.RESUME_OPTIMIZATION_PROMPT = exports.RESUME_ANALYSIS_PROMPT = void 0;
exports.RESUME_ANALYSIS_PROMPT = `You are an expert resume analyzer. Extract and structure the following resume text into clear sections.

Resume text:
{resumeText}

Return a JSON object with the following structure:
{
  "contact": { "name": "", "email": "", "phone": "", "location": "" },
  "summary": "",
  "experience": [{ "title": "", "company": "", "duration": "", "description": "" }],
  "education": [{ "degree": "", "institution": "", "year": "" }],
  "skills": [],
  "certifications": []
}

Be thorough and extract all relevant information.`;
exports.RESUME_OPTIMIZATION_PROMPT = `You are an ATS (Applicant Tracking System) optimization expert. Optimize the following resume sections for maximum ATS compatibility while maintaining authenticity.

Resume sections:
{sections}

Guidelines:
1. Use standard section headings (Experience, Education, Skills, etc.)
2. Include relevant keywords naturally
3. Use action verbs and quantifiable achievements
4. Ensure proper formatting and structure
5. Maintain professional tone

Return the optimized resume content in a structured format.`;
exports.RESUME_FORMAT_PROMPT = `Convert the following optimized resume content into clean, ATS-compatible HTML format.

Optimized content:
{optimizedContent}

Requirements:
1. Use semantic HTML5 elements
2. Ensure proper heading hierarchy (h1, h2, h3)
3. Include proper spacing and formatting
4. Make it print-friendly
5. Use inline styles for consistent rendering
6. Ensure no tables or complex layouts that break ATS parsing

Return only the HTML content, no markdown or code blocks.`;
exports.COVER_LETTER_MATCHING_PROMPT = `Analyze the following job description and resume to identify the most relevant experience and skills to highlight.

Job Description:
{jobDescription}

Resume:
{resumeText}

Identify:
1. Key requirements from the job description
2. Matching experience from the resume
3. Relevant skills and achievements
4. Areas where the candidate is a strong fit

Return a structured analysis.`;
exports.COVER_LETTER_PERSONALIZATION_PROMPT = `Create a personalized cover letter based on the job description and resume analysis.

Job Description:
{jobDescription}

Resume Analysis:
{analysis}

Tone: {tone}
Length: {length}

Write a compelling cover letter that:
1. Addresses the hiring manager professionally
2. Highlights relevant experience and achievements
3. Demonstrates understanding of the role
4. Shows enthusiasm and cultural fit
5. Includes a strong call to action

Return the cover letter content.`;
exports.COVER_LETTER_REFINEMENT_PROMPT = `Refine and polish the following cover letter to ensure it's professional, error-free, and impactful.

Cover Letter:
{coverLetter}

Requirements:
1. Check for grammar and spelling errors
2. Ensure consistent tone ({tone})
3. Verify it matches the desired length ({length})
4. Ensure smooth flow and readability
5. Make it compelling and memorable

Return the refined cover letter.`;

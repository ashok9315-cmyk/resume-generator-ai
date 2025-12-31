import { ChatAnthropic } from "@langchain/anthropic";
import logger from "./logger";

export class ResumeGenerator {
  private haiku35Model: ChatAnthropic;
  private haiku45Model: ChatAnthropic;

  constructor() {
    // Claude 3.5 Haiku - faster and cheaper for smaller content
    this.haiku35Model = new ChatAnthropic({
      model: "claude-3-5-haiku-20241022",
      temperature: 0.2,
      maxTokens: 8192,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Claude Sonnet 4.5 - higher token limit for larger content
    this.haiku45Model = new ChatAnthropic({
      model: "claude-sonnet-4-5-20250929",
      temperature: 0.2,
      maxTokens: 16000,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  private selectModel(inputText: string): ChatAnthropic {
    const estimatedInputTokens = this.estimateTokenCount(inputText);
    
    // If input is large (>2000 tokens), use Claude Sonnet 4.5 for comprehensive output
    if (estimatedInputTokens > 2000) {
      logger.info("Using Claude Sonnet 4.5 for large content", { 
        estimatedInputTokens,
        model: "claude-sonnet-4-5-20250929",
        maxTokens: 16000
      });
      return this.haiku45Model;
    } else {
      logger.info("Using Claude 3.5 Haiku for standard content", { 
        estimatedInputTokens,
        model: "claude-3-5-haiku-20241022",
        maxTokens: 8192
      });
      return this.haiku35Model;
    }
  }

  async generateResume(rawText: string): Promise<string> {
    logger.info("Starting resume generation", { textLength: rawText.length });

    // Select appropriate model based on input size
    const selectedModel = this.selectModel(rawText);

    const prompt = `You are an expert resume writer specializing in ATS-optimized resumes. 

Your task is to transform the provided resume text into a professional, ATS-friendly HTML format that preserves ALL content while enhancing presentation and optimization.

CRITICAL REQUIREMENTS:
1. PRESERVE ALL CONTENT - Do not omit any information from the original resume
2. Include EVERY work experience entry with complete details
3. Include ALL technical skills, tools, and technologies mentioned
4. Include ALL education entries and certifications
5. Include ALL awards and recognitions
6. Include ALL achievements, accomplishments, and metrics
7. Include ALL project details and environments
8. Maintain ALL contact information and personal details

CONTENT PRESERVATION RULES:
- Extract and include EVERY section from the original resume
- Do not summarize, abbreviate, or omit any details
- Preserve all quantifiable metrics and achievements
- Include all bullet points and responsibilities
- Maintain all company names, job titles, and dates
- Keep all technical skills and tools mentioned
- Include all certifications, awards, and accomplishments

OUTPUT FORMAT:
- Return ONLY the HTML code, no markdown code blocks
- Start directly with <!DOCTYPE html>
- Do not include any explanatory text before or after the HTML
- Generate a complete, standalone HTML document
- DO NOT add comments like "for brevity" or "additional entries would follow"
- Include ALL content explicitly in the HTML
- Make it printable HTML format with proper page layout and print-friendly styling

FORMATTING GUIDELINES:
1. Use clean, professional HTML structure with proper CSS styling
2. Create clear section headers based on the original resume structure
3. Use bullet points for achievements and responsibilities
4. Highlight quantifiable achievements and metrics
5. Ensure ATS-friendly formatting with proper heading tags
6. Use professional fonts and appropriate spacing
7. Make it visually appealing while maintaining readability
8. Bold the important keywords (technologies, skills, company names, job titles, achievements)
9. Add print-friendly CSS with proper margins and page breaks
10. Use professional color scheme that works well in both screen and print

ENHANCEMENT INSTRUCTIONS:
- Improve grammar and sentence structure where needed
- Use strong action verbs to start bullet points
- Ensure consistent formatting throughout
- Add relevant keywords for the candidate's field
- Organize information logically within each section
- Maintain chronological order for work experience
- Bold important keywords including: job titles, company names, technologies, programming languages, certifications, metrics/percentages, project names
- Add print-friendly CSS with @media print rules for proper page layout
- Use appropriate font sizes and line spacing for readability
- Ensure proper page margins and avoid content cutoff when printing

Original Resume Text:
${rawText}

Generate a comprehensive HTML resume that includes EVERY piece of information from the original text. Do not leave out any work experience entries, skills, certifications, awards, or accomplishments. The output should be longer and more detailed than a summary - it should be a complete transformation of ALL the original content.`;

    try {
      logger.info("Starting AI API call", {
        model: selectedModel.model,
        estimatedInputTokens: this.estimateTokenCount(rawText),
        inputLength: rawText.length,
        promptLength: prompt.length,
      });

      const apiCallStart = Date.now();
      const response = await selectedModel.invoke(prompt);
      const apiCallDuration = Date.now() - apiCallStart;
      
      let formattedResume = response.content as string;
      
      logger.info("AI API call completed", {
        model: selectedModel.model,
        apiCallDuration,
        responseLength: formattedResume.length,
        estimatedOutputTokens: this.estimateTokenCount(formattedResume),
      });
      
      // Clean up the response - remove markdown code blocks if present
      formattedResume = formattedResume.replace(/```html\n?/g, '');
      formattedResume = formattedResume.replace(/```\n?/g, '');
      formattedResume = formattedResume.trim();
      
      logger.info("Response cleanup completed", {
        originalLength: (response.content as string).length,
        cleanedLength: formattedResume.length,
        hadMarkdownBlocks: (response.content as string).includes('```'),
      });
      
      // Remove any explanatory text before the HTML
      const htmlStart = formattedResume.indexOf('<!DOCTYPE');
      if (htmlStart > 0) {
        logger.info("Removing text before DOCTYPE", {
          removedCharacters: htmlStart,
          removedText: formattedResume.substring(0, Math.min(htmlStart, 200)),
        });
        formattedResume = formattedResume.substring(htmlStart);
      }
      
      // Remove any analysis or commentary text after the closing </html> tag
      const htmlEndIndex = formattedResume.lastIndexOf('</html>');
      if (htmlEndIndex !== -1) {
        const afterHtml = formattedResume.substring(htmlEndIndex + 7).trim();
        if (afterHtml.length > 0) {
          logger.info("Removing analysis text after HTML content", {
            removedText: afterHtml.substring(0, Math.min(afterHtml.length, 200)),
            removedCharacters: afterHtml.length,
          });
          formattedResume = formattedResume.substring(0, htmlEndIndex + 7);
        }
      }
      
      // Also check for analysis patterns and remove them
      const analysisPatterns = [
        /This resume effectively:[\s\S]*$/i,
        /✅[\s\S]*$/,
        /The resume[\s\S]*$/i,
        /Analysis:[\s\S]*$/i,
        /Summary:[\s\S]*$/i,
      ];
      
      for (const pattern of analysisPatterns) {
        if (pattern.test(formattedResume)) {
          const match = formattedResume.match(pattern);
          if (match && match.index !== undefined) {
            logger.info("Removing analysis pattern from resume", {
              pattern: pattern.toString(),
              removedText: match[0].substring(0, Math.min(match[0].length, 200)),
              removedCharacters: match[0].length,
            });
            formattedResume = formattedResume.substring(0, match.index).trim();
            break;
          }
        }
      }
      
      // Ensure it starts with DOCTYPE
      if (!formattedResume.startsWith('<!DOCTYPE')) {
        logger.warn('Generated content does not start with DOCTYPE', { 
          contentStart: formattedResume.substring(0, 500),
          contentLength: formattedResume.length 
        });
        
        // Try to fix common issues
        if (formattedResume.includes('<!DOCTYPE')) {
          const doctypeIndex = formattedResume.indexOf('<!DOCTYPE');
          formattedResume = formattedResume.substring(doctypeIndex);
          logger.info('Fixed HTML by extracting from DOCTYPE position', {
            extractedFromIndex: doctypeIndex,
          });
        } else if (formattedResume.includes('<html')) {
          // If no DOCTYPE but has HTML tag, add DOCTYPE
          const htmlIndex = formattedResume.indexOf('<html');
          const htmlContent = formattedResume.substring(htmlIndex);
          formattedResume = '<!DOCTYPE html>\n' + htmlContent;
          logger.info('Added DOCTYPE to HTML content', {
            htmlFoundAtIndex: htmlIndex,
          });
        } else {
          // Log the actual content for debugging and temporarily allow it
          logger.error('Generated content is not HTML - wrapping in basic structure', { 
            content: formattedResume.substring(0, 1000),
            fullLength: formattedResume.length,
            model: selectedModel.model,
            apiCallDuration,
          });
          // Temporarily wrap non-HTML content in basic HTML structure
          formattedResume = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        pre { white-space: pre-wrap; }
    </style>
</head>
<body>
    <pre>${formattedResume.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
          logger.info('Wrapped non-HTML content in basic HTML structure', {
            finalLength: formattedResume.length,
          });
        }
      }
      
      // Check if the content seems complete (basic validation)
      const contentLength = formattedResume.length;
      const inputLength = rawText.length;
      
      // Log content ratio for monitoring
      logger.info("Content generation ratio analysis", { 
        inputLength,
        outputLength: contentLength,
        ratio: contentLength / inputLength,
        model: selectedModel.model,
        apiCallDuration,
        estimatedInputTokens: this.estimateTokenCount(rawText),
        estimatedOutputTokens: this.estimateTokenCount(formattedResume),
      });
      
      logger.info("Resume generation completed successfully", { 
        outputLength: formattedResume.length,
        totalProcessingTime: Date.now() - apiCallStart,
        model: selectedModel.model,
      });
      
      return formattedResume;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Resume generation failed", { 
        error: errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        model: selectedModel.model,
        inputLength: rawText.length,
        estimatedInputTokens: this.estimateTokenCount(rawText),
      });
      throw error;
    }
  }
}
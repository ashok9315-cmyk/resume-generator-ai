import { ChatAnthropic } from "@langchain/anthropic";
import logger from "./logger";

export class CoverLetterGenerator {
  private haiku35Model: ChatAnthropic;
  private haiku45Model: ChatAnthropic;

  constructor() {
    // Claude 3.5 Haiku - faster and cheaper for smaller content
    this.haiku35Model = new ChatAnthropic({
      model: "claude-3-5-haiku-20241022",
      temperature: 0.2,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Claude Sonnet 4.5 - higher token limit for larger content
    this.haiku45Model = new ChatAnthropic({
      model: "claude-sonnet-4-5-20250929",
      temperature: 0.2,
      maxTokens: 12000,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  private selectModel(jobDescription: string, resumeText: string): ChatAnthropic {
    const combinedText = jobDescription + resumeText;
    const estimatedInputTokens = this.estimateTokenCount(combinedText);
    
    // If combined input is large (>1500 tokens), use Claude Haiku 4.5
    if (estimatedInputTokens > 1500) {
      logger.info("Using Claude Sonnet 4.5 for large cover letter content", { 
        estimatedInputTokens,
        model: "claude-sonnet-4-5-20250929"
      });
      return this.haiku45Model;
    } else {
      logger.info("Using Claude 3.5 Haiku for standard cover letter content", { 
        estimatedInputTokens,
        model: "claude-3-5-haiku-20241022"
      });
      return this.haiku35Model;
    }
  }

  async generateCoverLetter(
    jobDescription: string,
    resumeText: string,
    tone: string = "professional",
    length: string = "medium"
  ): Promise<string> {
    logger.info("Starting cover letter generation", { 
      jobDescriptionLength: jobDescription.length,
      resumeTextLength: resumeText.length,
      tone,
      length
    });

    // Select appropriate model based on input size
    const selectedModel = this.selectModel(jobDescription, resumeText);

    const lengthGuidance = {
      short: "Keep it concise, around 200-250 words, focusing on the most relevant points.",
      medium: "Write a standard cover letter of 300-400 words with good detail.",
      long: "Create a comprehensive cover letter of 400-500 words with extensive detail."
    };

    const toneGuidance = {
      professional: "Use a formal, professional tone throughout.",
      casual: "Use a friendly but respectful tone, slightly more conversational.",
      enthusiastic: "Show genuine excitement and passion for the role and company."
    };

    const prompt = `You are an expert cover letter writer. Create a compelling, personalized cover letter based on the candidate's resume and the job description.

Job Description:
${jobDescription}

Candidate's Resume:
${resumeText}

Requirements:
- Tone: ${toneGuidance[tone as keyof typeof toneGuidance] || toneGuidance.professional}
- Length: ${lengthGuidance[length as keyof typeof lengthGuidance] || lengthGuidance.medium}
- Match the candidate's experience to the job requirements
- Highlight relevant achievements and skills
- Show genuine interest in the company and role
- Use a professional business letter format
- Include proper salutation and closing

IMPORTANT: Generate ONLY the cover letter in HTML format with proper styling for professional presentation. Do NOT include any analysis, commentary, explanations, or evaluation of the cover letter. Return only the HTML content.`;

    try {
      logger.info("Starting cover letter AI API call", {
        model: selectedModel.model,
        estimatedInputTokens: this.estimateTokenCount(jobDescription + resumeText),
        jobDescriptionLength: jobDescription.length,
        resumeTextLength: resumeText.length,
        tone,
        length,
        promptLength: prompt.length,
      });

      const apiCallStart = Date.now();
      const response = await selectedModel.invoke(prompt);
      const apiCallDuration = Date.now() - apiCallStart;
      
      let coverLetter = response.content as string;
      
      logger.info("Cover letter AI API call completed", {
        model: selectedModel.model,
        apiCallDuration,
        responseLength: coverLetter.length,
        estimatedOutputTokens: this.estimateTokenCount(coverLetter),
      });
      
      // Clean up the response - remove markdown code blocks if present
      coverLetter = coverLetter.replace(/```html\n?/g, '');
      coverLetter = coverLetter.replace(/```\n?/g, '');
      coverLetter = coverLetter.trim();
      
      logger.info("Cover letter response cleanup completed", {
        originalLength: (response.content as string).length,
        cleanedLength: coverLetter.length,
        hadMarkdownBlocks: (response.content as string).includes('```'),
      });
      
      // Remove any explanatory text before the HTML
      const htmlStart = coverLetter.indexOf('<!DOCTYPE');
      if (htmlStart > 0) {
        logger.info("Removing text before DOCTYPE in cover letter", {
          removedCharacters: htmlStart,
          removedText: coverLetter.substring(0, Math.min(htmlStart, 200)),
        });
        coverLetter = coverLetter.substring(htmlStart);
      }
      
      // If no DOCTYPE found, check for HTML tag
      if (!coverLetter.includes('<!DOCTYPE') && coverLetter.includes('<html')) {
        const htmlTagStart = coverLetter.indexOf('<html');
        if (htmlTagStart > 0) {
          coverLetter = coverLetter.substring(htmlTagStart);
          logger.info("Extracted cover letter from HTML tag position", {
            extractedFromIndex: htmlTagStart,
          });
        }
        // Add DOCTYPE if missing
        if (!coverLetter.startsWith('<!DOCTYPE')) {
          coverLetter = '<!DOCTYPE html>\n' + coverLetter;
          logger.info("Added DOCTYPE to cover letter HTML content");
        }
      }
      
      // Remove any analysis or commentary text after the closing </html> tag
      const htmlEndIndex = coverLetter.lastIndexOf('</html>');
      if (htmlEndIndex !== -1) {
        const afterHtml = coverLetter.substring(htmlEndIndex + 7).trim();
        if (afterHtml.length > 0) {
          logger.info("Removing analysis text after HTML content", {
            removedText: afterHtml.substring(0, Math.min(afterHtml.length, 200)),
            removedCharacters: afterHtml.length,
          });
          coverLetter = coverLetter.substring(0, htmlEndIndex + 7);
        }
      }
      
      // Also check for analysis patterns and remove them
      const analysisPatterns = [
        /This cover letter effectively:[\s\S]*$/i,
        /✅[\s\S]*$/,
        /The cover letter[\s\S]*$/i,
        /Analysis:[\s\S]*$/i,
        /Summary:[\s\S]*$/i,
      ];
      
      for (const pattern of analysisPatterns) {
        if (pattern.test(coverLetter)) {
          const match = coverLetter.match(pattern);
          if (match && match.index !== undefined) {
            logger.info("Removing analysis pattern from cover letter", {
              pattern: pattern.toString(),
              removedText: match[0].substring(0, Math.min(match[0].length, 200)),
              removedCharacters: match[0].length,
            });
            coverLetter = coverLetter.substring(0, match.index).trim();
            break;
          }
        }
      }
      
      // Basic validation - ensure we have some HTML content
      if (!coverLetter.includes('<html') && !coverLetter.includes('<div')) {
        logger.warn('Generated cover letter content may not be HTML', { 
          contentStart: coverLetter.substring(0, 200),
          contentLength: coverLetter.length,
          model: selectedModel.model,
          apiCallDuration,
        });
      }
      
      logger.info("Cover letter generation completed successfully", { 
        outputLength: coverLetter.length,
        totalProcessingTime: Date.now() - apiCallStart,
        model: selectedModel.model,
        tone,
        length,
        inputTokensEstimate: this.estimateTokenCount(jobDescription + resumeText),
        outputTokensEstimate: this.estimateTokenCount(coverLetter),
      });
      
      return coverLetter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Cover letter generation failed", { 
        error: errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        model: selectedModel.model,
        jobDescriptionLength: jobDescription.length,
        resumeTextLength: resumeText.length,
        tone,
        length,
        estimatedInputTokens: this.estimateTokenCount(jobDescription + resumeText),
      });
      throw error;
    }
  }
}
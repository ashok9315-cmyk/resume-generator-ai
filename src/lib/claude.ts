import Anthropic from "@anthropic-ai/sdk";
import logger from "./logging/winston";

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export async function callClaude(
  messages: Anthropic.MessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<Anthropic.Message> {
  const client = getAnthropicClient();
  const model = options?.model || "claude-sonnet-4-20250514";

  try {
    logger.info("Calling Claude API", {
      model,
      messageCount: messages.length,
    });

    const response = await client.messages.create({
      model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.3,
      messages,
    });

    logger.info("Claude API call completed", {
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return response;
  } catch (error) {
    logger.error("Claude API call failed", {
      model,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}



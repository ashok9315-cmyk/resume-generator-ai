import { Client } from "langsmith";

let langsmithClient: Client | null = null;

export function initializeLangSmith() {
  if (process.env.ENABLE_LANGSMITH_TRACING === "true" && process.env.LANGSMITH_API_KEY) {
    try {
      langsmithClient = new Client({
        apiKey: process.env.LANGSMITH_API_KEY,
        apiUrl: process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com",
      });
    } catch (error) {
      console.error("Failed to initialize LangSmith:", error);
    }
  }
}

export function getLangSmithClient(): Client | null {
  return langsmithClient;
}

export async function logAIOperation(
  runId: string,
  metadata: Record<string, unknown>
) {
  if (!langsmithClient) return;

  try {
    await langsmithClient.updateRun(runId, {
      extra: metadata,
    });
  } catch (error) {
    console.error("Failed to log AI operation:", error);
  }
}

export async function logAIFeedback(
  runId: string,
  score: number,
  comment?: string
) {
  if (!langsmithClient) return;

  try {
    await langsmithClient.createFeedback(runId, "user-feedback", {
      score,
      comment,
    });
  } catch (error) {
    console.error("Failed to log AI feedback:", error);
  }
}

// Initialize on import
initializeLangSmith();



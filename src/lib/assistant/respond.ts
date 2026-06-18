import { generateLocalAssistantReply } from "./local";
import { generateOpenAiReply } from "./openai";
import type { AssistantMessage, AssistantResponse } from "./types";

export async function generateAssistantReply(
  message: string,
  history: AssistantMessage[] = [],
): Promise<AssistantResponse> {
  const trimmed = message.trim();

  if (!trimmed) {
    return {
      reply:
        "Ask me about keyboard hardware — rankings, switches, layouts, wireless picks, or a board in the catalog.",
      source: "local",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const aiReply = await generateOpenAiReply(trimmed, history);
      if (aiReply) {
        return { reply: aiReply, source: "openai" };
      }
    } catch {
      // Fall back to the local catalog assistant.
    }
  }

  return {
    reply: generateLocalAssistantReply(trimmed),
    source: "local",
  };
}

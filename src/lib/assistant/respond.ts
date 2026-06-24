import { generateLocalAssistantReply } from "./local";
import { generateOpenAiReply } from "./openai";
import {
  INJECTION_BLOCKED_REPLY,
  isOffTopicMessage,
  OFF_TOPIC_REPLY,
  validateAssistantReply,
} from "./rules";
import {
  sanitizeAssistantHistory,
  sanitizeAssistantInput,
  shouldBlockAssistantRequest,
} from "./guard";
import type { AssistantMessage, AssistantResponse } from "./types";

function finalizeReply(reply: string): string {
  const validated = validateAssistantReply(reply);
  return validated.valid ? validated.reply : validated.reply;
}

export async function generateAssistantReply(
  message: string,
  history: AssistantMessage[] = [],
): Promise<AssistantResponse> {
  const trimmed = sanitizeAssistantInput(message);
  const safeHistory = sanitizeAssistantHistory(history);

  if (!trimmed) {
    return {
      reply:
        "Ask me about keyboard hardware — rankings, switches, layouts, wireless picks, or a board in the catalog.",
      source: "local",
    };
  }

  if (shouldBlockAssistantRequest(trimmed, safeHistory)) {
    return {
      reply: INJECTION_BLOCKED_REPLY,
      source: "local",
    };
  }

  if (isOffTopicMessage(trimmed)) {
    return {
      reply: OFF_TOPIC_REPLY,
      source: "local",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const aiReply = await generateOpenAiReply(trimmed, safeHistory);
      if (aiReply) {
        const validated = validateAssistantReply(aiReply);
        if (validated.valid) {
          return { reply: validated.reply, source: "openai" };
        }

        const localFallback = finalizeReply(
          generateLocalAssistantReply(trimmed),
        );
        return { reply: localFallback, source: "local" };
      }
    } catch {
      // Fall back to the local catalog assistant.
    }
  }

  return {
    reply: finalizeReply(generateLocalAssistantReply(trimmed)),
    source: "local",
  };
}

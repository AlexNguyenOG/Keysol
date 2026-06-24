import type { AssistantMessage } from "./types";
import {
  sanitizeAssistantOutput,
  wrapUserPrompt,
} from "./guard";
import { buildSystemPrompt } from "./prompt";

export async function generateOpenAiReply(
  message: string,
  history: AssistantMessage[] = [],
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...history.slice(-6).map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        { role: "user", content: wrapUserPrompt(message) },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const reply = data.choices?.[0]?.message?.content?.trim();
  return reply ? sanitizeAssistantOutput(reply) : null;
}

import type { AssistantMessage } from "./types";
import { buildCatalogContext } from "./knowledge";

const SYSTEM_PROMPT = `You are KeySol Guide, a helpful assistant for keyboard hardware questions on the KeySol keyboard finder website.

Rules:
- Answer only about keyboards, switches, layouts, gaming input, and related hardware.
- Use the catalog data below when recommending specific products.
- Be concise, practical, and friendly.
- If asked about something outside keyboards/peripherals, politely redirect.
- Mention KeySol speed scores when comparing boards in the catalog.
- Do not invent keyboards that are not in the catalog.

CATALOG DATA:
`;

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
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + buildCatalogContext() },
        ...history.slice(-6).map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        { role: "user", content: message },
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
  return reply || null;
}

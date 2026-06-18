import { NextResponse } from "next/server";
import { generateAssistantReply } from "@/lib/assistant/respond";
import type { AssistantMessage } from "@/lib/assistant/types";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 8;

function isValidHistory(value: unknown): value is AssistantMessage[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      (entry.role === "user" || entry.role === "assistant") &&
      typeof entry.content === "string" &&
      entry.content.length <= MAX_MESSAGE_LENGTH,
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message =
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const history =
    body &&
    typeof body === "object" &&
    "history" in body &&
    isValidHistory(body.history)
      ? body.history.slice(-MAX_HISTORY)
      : [];

  const result = await generateAssistantReply(message, history);

  return NextResponse.json(result);
}

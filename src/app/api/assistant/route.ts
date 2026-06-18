import { NextResponse } from "next/server";
import { generateAssistantReply } from "@/lib/assistant/respond";
import type { AssistantMessage } from "@/lib/assistant/types";
import {
  enforceRateLimit,
  jsonResponse,
  withRateLimitHeaders,
} from "@/lib/security/api";
import { readJsonBody } from "@/lib/security/request";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 8;

function isValidHistory(value: unknown): value is AssistantMessage[] {
  if (!Array.isArray(value)) {
    return false;
  }

  if (value.length > MAX_HISTORY) {
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
  const rate = enforceRateLimit(request, "assistant");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.data;
  const message =
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    return jsonResponse({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse({ error: "Message is too long" }, { status: 400 });
  }

  const history =
    body &&
    typeof body === "object" &&
    "history" in body &&
    isValidHistory(body.history)
      ? body.history.slice(-MAX_HISTORY)
      : [];

  const result = await generateAssistantReply(message, history);
  const response = jsonResponse(result);
  return withRateLimitHeaders(response, rate as RateLimitResult);
}

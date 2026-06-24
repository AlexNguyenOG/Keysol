import type { AssistantMessage } from "./types";
import {
  INJECTION_BLOCKED_REPLY,
  isOffTopicMessage,
  OFF_TOPIC_REPLY,
  validateAssistantReply,
} from "./rules";

export {
  INJECTION_BLOCKED_REPLY,
  isOffTopicMessage,
  OFF_TOPIC_REPLY,
  validateAssistantReply,
};

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) instructions/i,
  /disregard (the )?(system|above) (prompt|instructions)/i,
  /you are now (a|an)/i,
  /reveal (your|the) (system )?prompt/i,
  /show (me )?(your|the) (system )?instructions/i,
  /\bDAN\b mode/i,
  /jailbreak/i,
  /developer mode enabled/i,
  /act as (if )?you (have|had) no restrictions/i,
  /<\s*system\s*>/i,
  /OPENAI_API_KEY/i,
  /AUTH_SECRET/i,
];

const SENSITIVE_OUTPUT_PATTERNS = [
  /OPENAI_API_KEY/i,
  /AUTH_SECRET/i,
  /AVAILABILITY_CRON_SECRET/i,
  /RESEND_API_KEY/i,
  /BEGIN (RSA )?PRIVATE KEY/i,
  /system prompt:/i,
];

export function looksLikePromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeAssistantInput(text: string): string {
  return text
    .replace(/\0/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

export function sanitizeAssistantHistory(
  history: AssistantMessage[],
): AssistantMessage[] {
  return history
    .filter(
      (entry) => entry.role === "user" || entry.role === "assistant",
    )
    .map((entry) => ({
      role: entry.role,
      content: sanitizeAssistantInput(entry.content),
    }))
    .filter((entry) => entry.content.length > 0);
}

export function shouldBlockAssistantRequest(
  message: string,
  history: AssistantMessage[] = [],
): boolean {
  if (looksLikePromptInjection(message)) {
    return true;
  }

  return history.some((entry) => looksLikePromptInjection(entry.content));
}

export function sanitizeAssistantOutput(text: string): string {
  let output = text.trim();

  for (const pattern of SENSITIVE_OUTPUT_PATTERNS) {
    if (pattern.test(output)) {
      return OFF_TOPIC_REPLY;
    }
  }

  const validated = validateAssistantReply(output);
  if (!validated.valid) {
    return validated.reply;
  }

  if (output.length > 2_000) {
    output = `${output.slice(0, 2_000).trim()}…`;
  }

  return output;
}

export function wrapUserPrompt(message: string): string {
  return [
    "User question (answer only about keyboards/peripherals using catalog data):",
    "---",
    message,
    "---",
  ].join("\n");
}

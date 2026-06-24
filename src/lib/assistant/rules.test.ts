import { describe, expect, it } from "vitest";
import {
  isOffTopicMessage,
  OFF_TOPIC_REPLY,
  validateAssistantReply,
} from "./rules";

describe("assistant rules", () => {
  it("blocks clearly off-topic requests", () => {
    expect(isOffTopicMessage("What's the weather in Tokyo?")).toBe(true);
    expect(isOffTopicMessage("Write me a Python script")).toBe(true);
    expect(isOffTopicMessage("What is the fastest keyboard?")).toBe(false);
    expect(isOffTopicMessage("Explain Cherry MX Speed Silver")).toBe(false);
  });

  it("allows short greetings", () => {
    expect(isOffTopicMessage("Hi")).toBe(false);
    expect(isOffTopicMessage("Hello!")).toBe(false);
  });

  it("rejects product recommendations outside the catalog", () => {
    const result = validateAssistantReply(
      "You should buy the SuperBoard 9000 for $149 — it's the best deal right now.",
    );
    expect(result.valid).toBe(false);
    expect(result.reply).toBe(OFF_TOPIC_REPLY);
  });

  it("accepts catalog-grounded recommendations", () => {
    const result = validateAssistantReply(
      "For speed, consider the Wooting 60HE+ at $175 with rapid trigger and 8000 Hz polling.",
    );
    expect(result.valid).toBe(true);
  });
});

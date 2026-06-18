import { describe, expect, it } from "vitest";
import { generateLocalAssistantReply } from "./local";

describe("generateLocalAssistantReply", () => {
  it("explains rapid trigger", () => {
    const reply = generateLocalAssistantReply("What is rapid trigger?");
    expect(reply.toLowerCase()).toContain("rapid trigger");
  });

  it("returns top speed picks", () => {
    const reply = generateLocalAssistantReply("What is the fastest keyboard?");
    expect(reply).toContain("Wooting");
    expect(reply.toLowerCase()).toContain("speed");
  });

  it("finds wireless options", () => {
    const reply = generateLocalAssistantReply("Any wireless keyboards?");
    expect(reply.toLowerCase()).toContain("wireless");
  });

  it("answers budget questions", () => {
    const reply = generateLocalAssistantReply("Best keyboard under $200");
    expect(reply.toLowerCase()).toContain("under $200");
  });

  it("returns a specific keyboard summary", () => {
    const reply = generateLocalAssistantReply("Tell me about the Keychron K2 HE");
    expect(reply).toContain("Keychron K2 HE");
  });
});

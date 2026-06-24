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

  it("refuses off-topic questions", () => {
    const reply = generateLocalAssistantReply("Write me Python code for a web scraper");
    expect(reply.toLowerCase()).toContain("only help with keyboard");
  });

  it("answers switch technology questions", () => {
    const reply = generateLocalAssistantReply("What is Cherry MX Speed Silver?");
    expect(reply).toContain("Cherry MX Speed Silver");
  });

  it("knows newer catalog boards", () => {
    const reply = generateLocalAssistantReply("Keychron Q6 HE 8K");
    expect(reply).toContain("Keychron Q6 HE 8K");
  });
});

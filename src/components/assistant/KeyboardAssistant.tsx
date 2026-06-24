"use client";

import { useEffect, useRef, useState } from "react";
import type { AssistantMessage } from "@/lib/assistant/types";

const STARTER_PROMPTS = [
  "What's the fastest keyboard?",
  "Explain rapid trigger",
  "Cherry MX vs magnetic switches",
  "Best keyboard under $200",
];

export function KeyboardAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm KeySol Guide. Ask me about switches, speed rankings, layouts, wireless picks, tokens, or any keyboard in our catalog.",
    },
  ]);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!open || !panelRef.current) {
        return;
      }

      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) {
      return;
    }

    const nextMessages: AssistantMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(-8),
        }),
      });

      if (!response.ok) {
        throw new Error("Assistant request failed");
      }

      const data = (await response.json()) as { reply: string };
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Sorry — I couldn't answer that right now. Try asking about a keyboard in the rankings or a hardware term like rapid trigger.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div ref={panelRef} className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-surface shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 bg-bg-primary/80 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  Key<span className="gradient-text">Sol</span> Guide
                </p>
                <p className="text-xs text-text-muted">
                  Keyboard hardware Q&amp;A
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            ref={transcriptRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-solana-purple to-solana-green text-bg-primary"
                      : "border border-white/10 bg-bg-primary/70 text-text-primary"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-bg-primary/70 px-3 py-2 text-sm text-text-muted">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-text-muted transition-colors hover:border-solana-purple/40 hover:text-text-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 bg-bg-primary/80 p-4"
          >
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                rows={2}
                placeholder="Ask about switches, layouts, rankings…"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-solana-purple/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2 text-sm font-semibold text-bg-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-4 py-3 text-sm font-semibold text-bg-primary shadow-lg shadow-solana-purple/20 transition-transform hover:scale-[1.02]"
        aria-expanded={open}
        aria-controls="keysol-assistant-panel"
      >
        {open ? "Close Guide" : "Ask KeySol Guide"}
      </button>
    </div>
  );
}

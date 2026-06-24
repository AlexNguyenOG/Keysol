"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GradientText } from "@/components/ui/GradientText";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-solana-purple/50";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = (await response.json()) as {
      message?: string;
      error?: string;
    };

    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to process request.");
      return;
    }

    setMessage(
      data.message ??
        "If an account exists for that email, password reset instructions were sent.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="gradient-border rounded-2xl p-8">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-solana-green">
            Account recovery
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Reset your <GradientText as="span">password</GradientText>
          </h1>
          <p className="mt-3 text-sm text-text-muted">
            Enter your email and we&apos;ll send reset instructions if an
            account exists.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-xl border border-solana-green/30 bg-solana-green/10 px-3 py-2 text-sm text-solana-green">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2.5 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-solana-green hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

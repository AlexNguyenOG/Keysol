"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { GradientText } from "@/components/ui/GradientText";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-solana-purple/50";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = (await response.json()) as { error?: string };

    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to reset password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="gradient-border rounded-2xl p-8">
          <p className="text-sm text-text-muted">
            This reset link is invalid. Request a new one from the forgot
            password page.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block font-medium text-solana-green hover:underline"
          >
            Forgot password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="gradient-border rounded-2xl p-8">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-solana-green">
            New password
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Choose a <GradientText as="span">new password</GradientText>
          </h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="At least 8 characters with a letter and number"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2.5 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 w-full max-w-md" />}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}

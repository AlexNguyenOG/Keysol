"use client";

import { useState } from "react";
import { DropsAdminPanel } from "@/components/admin/DropsAdminPanel";
import type { DropCandidate } from "@/lib/drops/types";

export function DropsAdminClient() {
  const [secret, setSecret] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [initialCandidates, setInitialCandidates] = useState<
    DropCandidate[] | null
  >(null);

  async function verifySecret(candidate: string) {
    setChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/drops/candidates?status=pending", {
        cache: "no-store",
        headers: { authorization: `Bearer ${candidate}` },
      });

      if (!response.ok) {
        throw new Error("Invalid admin key.");
      }

      const data = (await response.json()) as { candidates?: DropCandidate[] };
      setSecret(candidate);
      setInitialCandidates(data.candidates ?? []);
    } catch (verifyError) {
      setSecret("");
      setInitialCandidates(null);
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Invalid admin key.",
      );
    } finally {
      setChecking(false);
    }
  }

  if (!secret || initialCandidates === null) {
    return (
      <form
        className="mx-auto max-w-md rounded-2xl border border-white/10 bg-bg-surface p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void verifySecret(draft.trim());
        }}
      >
        <h2 className="text-lg font-semibold text-text-primary">Admin access</h2>
        <p className="mt-2 text-sm text-text-muted">
          Enter your KeySol admin key to review keyboard drops. Prefer{" "}
          <code className="text-text-primary">ADMIN_API_SECRET</code>; the cron
          secret still works as a fallback.
        </p>
        <label className="mt-4 block text-sm">
          <span className="text-text-muted">Admin key</span>
          <input
            type="password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            required
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-white/10 bg-bg-primary px-3 py-2"
          />
        </label>
        {error && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={checking}
          className="mt-4 rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-5 py-2.5 text-sm font-semibold text-bg-primary disabled:opacity-50"
        >
          {checking ? "Verifying…" : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <DropsAdminPanel
      adminSecret={secret}
      initialCandidates={initialCandidates}
      onUnauthorized={() => {
        setSecret("");
        setInitialCandidates(null);
        setError("Session expired. Enter your admin key again.");
      }}
    />
  );
}

"use client";

import { useCallback, useState } from "react";
import { brands } from "@/data/brands";
import type { DropCandidate } from "@/lib/drops/types";
import { DROP_TOKEN_DEFAULTS } from "@/lib/drops/types";

interface DropsAdminPanelProps {
  adminSecret: string;
  initialCandidates: DropCandidate[];
  onUnauthorized: () => void;
}

function adminHeaders(secret: string, json = false): HeadersInit {
  const headers: Record<string, string> = {
    authorization: `Bearer ${secret}`,
  };

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export function DropsAdminPanel({
  adminSecret,
  initialCandidates,
  onUnauthorized,
}: DropsAdminPanelProps) {
  const [candidates, setCandidates] = useState<DropCandidate[]>(initialCandidates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  const [manualBrandId, setManualBrandId] = useState(brands[0]?.id ?? "");
  const [manualName, setManualName] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  const handleUnauthorized = useCallback(
    (response: Response) => {
      if (response.status === 401) {
        onUnauthorized();
        return true;
      }

      return false;
    },
    [onUnauthorized],
  );

  const loadCandidates = useCallback(
    async (status: "pending" | "approved" | "rejected") => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/drops/candidates?status=${status}`,
          {
            cache: "no-store",
            headers: adminHeaders(adminSecret),
          },
        );

        if (handleUnauthorized(response)) {
          return;
        }

        const data = (await response.json()) as {
          candidates?: DropCandidate[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load candidates.");
        }

        setCandidates(data.candidates ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load candidates.",
        );
      } finally {
        setLoading(false);
      }
    },
    [adminSecret, handleUnauthorized],
  );

  async function changeStatusFilter(
    status: "pending" | "approved" | "rejected",
  ) {
    setStatusFilter(status);
    await loadCandidates(status);
  }

  async function approveCandidate(candidate: DropCandidate) {
    setActionId(candidate.id);
    setError(null);

    try {
      const response = await fetch("/api/admin/drops/approve", {
        method: "POST",
        headers: adminHeaders(adminSecret, true),
        body: JSON.stringify({
          candidateId: candidate.id,
          maxSupply: DROP_TOKEN_DEFAULTS.maxSupply,
          rarityScore: DROP_TOKEN_DEFAULTS.rarityScore,
        }),
      });

      if (handleUnauthorized(response)) {
        return;
      }

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Approval failed.");
      }

      await loadCandidates(statusFilter);
    } catch (approveError) {
      setError(
        approveError instanceof Error ? approveError.message : "Approval failed.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function rejectCandidate(candidateId: string) {
    setActionId(candidateId);
    setError(null);

    try {
      const response = await fetch("/api/admin/drops/reject", {
        method: "POST",
        headers: adminHeaders(adminSecret, true),
        body: JSON.stringify({ candidateId }),
      });

      if (handleUnauthorized(response)) {
        return;
      }

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Reject failed.");
      }

      await loadCandidates(statusFilter);
    } catch (rejectError) {
      setError(
        rejectError instanceof Error ? rejectError.message : "Reject failed.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function submitManualCandidate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/admin/drops/manual", {
        method: "POST",
        headers: adminHeaders(adminSecret, true),
        body: JSON.stringify({
          brandId: manualBrandId,
          name: manualName,
          sourceUrl: manualUrl,
          purchaseUrl: manualUrl,
        }),
      });

      if (handleUnauthorized(response)) {
        return;
      }

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Manual submit failed.");
      }

      setManualName("");
      setManualUrl("");
      setStatusFilter("pending");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Manual submit failed.",
      );
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
        <p className="text-sm text-text-muted">
          Approve candidates to publish them at the top of the home page with a
          legendary token (default max supply {DROP_TOKEN_DEFAULTS.maxSupply}).
        </p>
      </div>

      <form
        onSubmit={submitManualCandidate}
        className="rounded-2xl border border-white/10 bg-bg-surface p-6"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Submit manual candidate
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-text-muted">Brand</span>
            <select
              value={manualBrandId}
              onChange={(event) => setManualBrandId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-primary px-3 py-2"
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Product name</span>
            <input
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-primary px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-text-muted">Source / purchase URL (HTTPS)</span>
            <input
              type="url"
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              required
              placeholder="https://"
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-primary px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-5 py-2.5 text-sm font-semibold text-bg-primary"
        >
          Add for review
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => void changeStatusFilter(status)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              statusFilter === status
                ? "bg-solana-purple/20 text-solana-purple"
                : "border border-white/10 text-text-muted"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-text-muted">Loading candidates…</p>
      ) : candidates.length === 0 ? (
        <p className="text-text-muted">No {statusFilter} candidates.</p>
      ) : (
        <ul className="space-y-4">
          {candidates.map((candidate) => (
            <li
              key={candidate.id}
              className="rounded-2xl border border-white/10 bg-bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-solana-green">
                    {candidate.brandId} · {candidate.detectionSource}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-text-primary">
                    {candidate.name}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    Confidence {(candidate.confidence * 100).toFixed(0)}% ·{" "}
                    {candidate.signals.join(", ")}
                  </p>
                  {candidate.rawSnippet && (
                    <p className="mt-2 text-sm text-text-muted">
                      {candidate.rawSnippet}
                    </p>
                  )}
                  <a
                    href={candidate.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-solana-green hover:underline"
                  >
                    View source
                  </a>
                </div>

                {candidate.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={actionId === candidate.id}
                      onClick={() => void approveCandidate(candidate)}
                      className="rounded-lg bg-solana-green/20 px-4 py-2 text-sm font-medium text-solana-green disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionId === candidate.id}
                      onClick={() => void rejectCandidate(candidate.id)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-text-muted disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

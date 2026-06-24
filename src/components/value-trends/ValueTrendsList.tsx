"use client";

import { useEffect, useMemo, useState } from "react";
import { keyboards } from "@/data/keyboards";
import { KeyboardShowcaseMedia } from "@/components/ui/KeyboardShowcaseMedia";
import { getKeyboardTokensByRarity } from "@/lib/tokens";
import { computeEffectiveTokenScore } from "@/lib/tokens/scoring";
import type { ValueTrend } from "@/lib/tokens/trend";
import { AVAILABILITY_LABELS, AVAILABILITY_STYLES } from "@/lib/availability/labels";
import { ValueTrendBadge } from "@/components/ui/ValueTrendBadge";
import type { TokenSnapshot } from "@/types";

type TrendSort = "trend" | "effective" | "delta";

const TREND_RANK: Record<ValueTrend, number> = {
  rising: 0,
  stable: 1,
  dropping: 2,
};

const sortOptions: { value: TrendSort; label: string }[] = [
  { value: "effective", label: "Effective score" },
  { value: "trend", label: "Effective score + trend" },
  { value: "delta", label: "Biggest movers" },
];

function keyboardFor(id: string) {
  return keyboards.find((keyboard) => keyboard.id === id);
}

function buildStaticSnapshots(): TokenSnapshot[] {
  const snapshotAt = new Date(0).toISOString();

  return getKeyboardTokensByRarity().map((token) => {
    const stockStatus = "unknown" as const;
    const effectiveScore = computeEffectiveTokenScore(
      token.rarityScore,
      stockStatus,
    );

    return {
      keyboardId: token.keyboardId,
      token,
      rarityScore: token.rarityScore,
      rarityTier: token.rarityTier,
      stockStatus,
      stockScore: 50,
      effectiveScore,
      previousEffectiveScore: null,
      valueTrend: "stable" as const,
      checkedAt: null,
      stockSource: null,
      snapshotAt,
    };
  });
}

function scoreDelta(snapshot: TokenSnapshot): number {
  if (snapshot.previousEffectiveScore === null) {
    return 0;
  }

  return snapshot.effectiveScore - snapshot.previousEffectiveScore;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple to-solana-green text-sm font-bold text-bg-primary">
        {rank}
      </span>
    );
  }

  if (rank <= 3) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-solana-green/40 bg-solana-green/10 text-sm font-bold text-solana-green">
        {rank}
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-text-muted">
      {rank}
    </span>
  );
}

function formatDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }

  if (delta < 0) {
    return `${delta}`;
  }

  return "0";
}

export function ValueTrendsList() {
  const [snapshots, setSnapshots] = useState<TokenSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<TrendSort>("effective");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/tokens/snapshot", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load token snapshots");
        }

        const data = (await response.json()) as { snapshots: TokenSnapshot[] };

        if (!cancelled) {
          setSnapshots(data.snapshots);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshots(buildStaticSnapshots());
          setError("Could not load live trend data. Showing catalog defaults.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const list = [...snapshots];

    if (sort === "effective") {
      return list.sort((a, b) => b.effectiveScore - a.effectiveScore);
    }

    if (sort === "delta") {
      return list.sort((a, b) => Math.abs(scoreDelta(b)) - Math.abs(scoreDelta(a)));
    }

    if (sort === "trend") {
      return list.sort((a, b) => {
        const scoreDiff = b.effectiveScore - a.effectiveScore;
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return TREND_RANK[a.valueTrend] - TREND_RANK[b.valueTrend];
      });
    }

    return list.sort((a, b) => b.effectiveScore - a.effectiveScore);
  }, [snapshots, sort]);

  const risingCount = snapshots.filter((s) => s.valueTrend === "rising").length;
  const droppingCount = snapshots.filter((s) => s.valueTrend === "dropping").length;

  return (
    <section aria-labelledby="value-trends-title">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="value-trends-title"
            className="text-xl font-semibold text-text-primary sm:text-2xl"
          >
            Keyboard value trends
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {loading
              ? "Loading trends…"
              : `${sorted.length} keyboards · ${risingCount} rising · ${droppingCount} dropping`}
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <span id="value-trends-sort-label" className="text-text-muted">
            Sort by
          </span>
          <select
            id="value-trends-sort"
            aria-labelledby="value-trends-sort-label"
            value={sort}
            onChange={(event) => setSort(event.target.value as TrendSort)}
            className="rounded-lg border border-white/10 bg-bg-surface px-3 py-2 text-text-primary outline-none focus:border-solana-purple/50"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {sorted.map((snapshot, index) => {
          const keyboard = keyboardFor(snapshot.keyboardId);
          const delta = scoreDelta(snapshot);
          const stockStyles = AVAILABILITY_STYLES[snapshot.stockStatus];

          return (
            <article
              key={snapshot.token.id}
              className="gradient-border rounded-2xl p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex items-start gap-4">
                  <RankBadge rank={index + 1} />

                  {keyboard && (
                    <KeyboardShowcaseMedia
                      keyboardId={keyboard.id}
                      imageSrc={keyboard.image}
                      alt={`${keyboard.name} product photo`}
                      className="hidden h-20 w-28 shrink-0 rounded-lg sm:block sm:h-24 sm:w-32"
                      imageClassName="object-contain p-0.5"
                      sizes="128px"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-solana-purple sm:text-base">
                        {snapshot.token.symbol}
                      </span>
                      {!loading && (
                        <ValueTrendBadge trend={snapshot.valueTrend} />
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary">
                      {keyboard?.name ?? snapshot.keyboardId}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted">
                      {loading ? (
                        "Loading trend…"
                      ) : (
                        <>
                          Effective score{" "}
                          <span className="font-semibold text-solana-green">
                            {snapshot.effectiveScore}
                          </span>
                          {snapshot.previousEffectiveScore !== null && (
                            <>
                              {" "}
                              · was {snapshot.previousEffectiveScore} (
                              <span
                                className={
                                  delta > 0
                                    ? "text-solana-green"
                                    : delta < 0
                                      ? "text-red-400"
                                      : "text-text-muted"
                                }
                              >
                                {formatDelta(delta)}
                              </span>
                              )
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <dl className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[22rem]">
                  <div className="rounded-lg border border-white/10 bg-bg-primary/50 px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                      Trend
                    </dt>
                    <dd className="mt-1">
                      {loading ? (
                        <span className="text-xs text-text-muted">…</span>
                      ) : (
                        <ValueTrendBadge trend={snapshot.valueTrend} />
                      )}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-bg-primary/50 px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                      Effective
                    </dt>
                    <dd className="mt-0.5 text-lg font-bold text-solana-green">
                      {loading ? "—" : snapshot.effectiveScore}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-bg-primary/50 px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                      Change
                    </dt>
                    <dd
                      className={`mt-0.5 font-semibold ${
                        delta > 0
                          ? "text-solana-green"
                          : delta < 0
                            ? "text-red-400"
                            : "text-text-muted"
                      }`}
                    >
                      {loading ? "—" : formatDelta(delta)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-bg-primary/50 px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                      Stock
                    </dt>
                    <dd className="mt-1">
                      {loading ? (
                        <span className="text-xs text-text-muted">…</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${stockStyles.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${stockStyles.dot}`}
                          />
                          {AVAILABILITY_LABELS[snapshot.stockStatus]}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

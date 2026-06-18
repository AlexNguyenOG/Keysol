"use client";

import { useEffect, useMemo, useState } from "react";
import { keyboards } from "@/data/keyboards";
import { getKeyboardTokensByRarity } from "@/lib/tokens";
import { computeEffectiveTokenScore } from "@/lib/tokens/scoring";
import { AVAILABILITY_LABELS, AVAILABILITY_STYLES } from "@/lib/availability/labels";
import type { TokenSnapshot } from "@/types";

type TokenSort = "effective" | "rarity" | "symbol";

const sortOptions: { value: TokenSort; label: string }[] = [
  { value: "effective", label: "Effective score" },
  { value: "rarity", label: "Catalog rarity" },
  { value: "symbol", label: "Symbol (A–Z)" },
];

const tierStyles = {
  legendary:
    "border-solana-purple/40 bg-solana-purple/15 text-solana-purple",
  rare: "border-solana-green/40 bg-solana-green/10 text-solana-green",
  uncommon: "border-white/20 bg-white/5 text-text-muted",
} as const;

function keyboardName(id: string): string {
  return keyboards.find((keyboard) => keyboard.id === id)?.name ?? id;
}

function buildStaticSnapshots(): TokenSnapshot[] {
  const snapshotAt = new Date(0).toISOString();

  return getKeyboardTokensByRarity().map((token) => {
    const stockStatus = "unknown" as const;
    const stockScore = 50;
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
      stockScore,
      effectiveScore,
      checkedAt: null,
      stockSource: null,
      snapshotAt,
    };
  });
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

function StockBadge({ status }: { status: TokenSnapshot["stockStatus"] }) {
  const styles = AVAILABILITY_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {AVAILABILITY_LABELS[status]}
    </span>
  );
}

export function TokenCatalogList() {
  const [snapshots, setSnapshots] = useState<TokenSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<TokenSort>("effective");

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
          setError("Could not load live stock data. Showing catalog rarity only.");
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

    if (sort === "rarity") {
      return list.sort((a, b) => b.rarityScore - a.rarityScore);
    }

    if (sort === "symbol") {
      return list.sort((a, b) =>
        a.token.symbol.localeCompare(b.token.symbol),
      );
    }

    return list.sort((a, b) => b.effectiveScore - a.effectiveScore);
  }, [snapshots, sort]);

  return (
    <section aria-labelledby="token-catalog-title">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="token-catalog-title"
            className="text-xl font-semibold text-text-primary sm:text-2xl"
          >
            Token catalog
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {loading
              ? "Loading snapshots…"
              : `${sorted.length} tokens · live stock blended into effective score`}
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <span id="token-sort-label" className="text-text-muted">
            Sort by
          </span>
          <select
            id="token-sort"
            aria-labelledby="token-sort-label"
            value={sort}
            onChange={(event) => setSort(event.target.value as TokenSort)}
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
        {sorted.map((snapshot, index) => (
          <article
            key={snapshot.token.id}
            className="gradient-border rounded-2xl p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <RankBadge rank={index + 1} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-solana-purple sm:text-base">
                      {snapshot.token.symbol}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tierStyles[snapshot.token.rarityTier]}`}
                    >
                      {snapshot.token.rarityTier}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-text-primary">
                    {keyboardName(snapshot.keyboardId)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {snapshot.token.rationale}
                  </p>
                </div>
              </div>

              <dl className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[22rem]">
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
                    Rarity
                  </dt>
                  <dd className="mt-0.5 font-semibold text-text-primary">
                    {snapshot.rarityScore}
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-bg-primary/50 px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-wide text-text-muted">
                    Max supply
                  </dt>
                  <dd className="mt-0.5 font-semibold text-text-primary">
                    {snapshot.token.maxSupply.toLocaleString()}
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
                      <StockBadge status={snapshot.stockStatus} />
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

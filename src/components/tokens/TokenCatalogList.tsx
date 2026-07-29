"use client";

import { useEffect, useMemo, useState } from "react";
import { keyboards } from "@/data/keyboards";
import { getKeyboardTokensByRarity } from "@/lib/tokens";
import { computeEffectiveTokenScore } from "@/lib/tokens/scoring";
import {
  compareCollectibleRarity,
  getRarityTierForToken,
  STOCK_PREFERENCE_RANK,
} from "@/lib/tokens/rarity";
import type { TokenSnapshot } from "@/types";
import { CollectibleCard } from "./CollectibleCard";
import { useTokenCollectibles } from "./TokenCollectiblesProvider";

type TokenSort = "rarity" | "stock" | "symbol";
type OwnershipFilter = "all" | "owned" | "missing";

const sortOptions: { value: TokenSort; label: string }[] = [
  { value: "rarity", label: "Rarity (Legendary first)" },
  { value: "stock", label: "In stock first" },
  { value: "symbol", label: "Symbol (A–Z)" },
];

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
      stockStatus,
      stockScore,
      effectiveScore,
      previousEffectiveScore: null,
      valueTrend: "stable",
      checkedAt: null,
      stockSource: null,
      snapshotAt,
    };
  });
}

function keyboardFor(id: string) {
  return keyboards.find((keyboard) => keyboard.id === id);
}

function rarityCompare(a: TokenSnapshot, b: TokenSnapshot) {
  return compareCollectibleRarity(
    {
      rarityScore: a.rarityScore,
      maxSupply: a.token.maxSupply,
      stockStatus: a.stockStatus,
    },
    {
      rarityScore: b.rarityScore,
      maxSupply: b.token.maxSupply,
      stockStatus: b.stockStatus,
    },
  );
}

function sortByRarity(list: TokenSnapshot[]) {
  return list.sort(rarityCompare);
}

export function TokenCatalogList() {
  const { connected, claimedIds, enabled } = useTokenCollectibles();
  const [snapshots, setSnapshots] = useState<TokenSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<TokenSort>("rarity");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");

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
          setError(
            "Could not load live stock data. Showing catalog collectibles only.",
          );
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
    let list = [...snapshots];

    if (connected && ownershipFilter === "owned") {
      list = list.filter((snapshot) => claimedIds.has(snapshot.keyboardId));
    } else if (connected && ownershipFilter === "missing") {
      list = list.filter((snapshot) => !claimedIds.has(snapshot.keyboardId));
    }

    if (sort === "symbol") {
      return list.sort((a, b) =>
        a.token.symbol.localeCompare(b.token.symbol),
      );
    }

    if (sort === "stock") {
      return list.sort((a, b) => {
        const byStock =
          STOCK_PREFERENCE_RANK[a.stockStatus] -
          STOCK_PREFERENCE_RANK[b.stockStatus];
        if (byStock !== 0) {
          return byStock;
        }
        return rarityCompare(a, b);
      });
    }

    return sortByRarity(list);
  }, [snapshots, sort, ownershipFilter, connected, claimedIds]);

  const dexNumbers = useMemo(() => {
    // Stable dex index by rarity order so Legendary boards get low numbers.
    const byRarity = sortByRarity([...snapshots]);
    const map = new Map<string, number>();
    byRarity.forEach((snapshot, index) => {
      map.set(snapshot.keyboardId, index + 1);
    });
    return map;
  }, [snapshots]);

  const legendaryCount = useMemo(
    () =>
      snapshots.filter(
        (snapshot) => getRarityTierForToken(snapshot.token).tier === "legendary",
      ).length,
    [snapshots],
  );

  return (
    <section aria-labelledby="token-catalog-title" className="mb-16">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-solana-green">
            Collectibles dex
          </p>
          <h2
            id="token-catalog-title"
            className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl"
          >
            Keyboard collectibles
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {loading
              ? "Loading dex…"
              : `${sorted.length} of ${snapshots.length} shown · ${legendaryCount} Legendary · higher tiers are rarer to catch`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {enabled && connected ? (
            <div className="flex rounded-lg border border-white/10 bg-bg-surface p-1 text-sm">
              {(
                [
                  ["all", "All"],
                  ["owned", "Caught"],
                  ["missing", "Missing"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOwnershipFilter(value)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    ownershipFilter === value
                      ? "bg-white/10 text-text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <label className="flex items-center gap-3 text-sm">
            <span id="token-sort-label" className="text-text-muted">
              Sort
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
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((snapshot) => (
          <CollectibleCard
            key={snapshot.token.id}
            snapshot={snapshot}
            keyboard={keyboardFor(snapshot.keyboardId)}
            dexNumber={dexNumbers.get(snapshot.keyboardId) ?? 0}
          />
        ))}
      </div>

      {!loading && sorted.length === 0 ? (
        <p className="mt-8 text-center text-sm text-text-muted">
          No collectibles match this filter.
        </p>
      ) : null}
    </section>
  );
}

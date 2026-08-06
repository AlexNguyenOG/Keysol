"use client";

import { useMemo, useState } from "react";
import { keyboards as staticKeyboards } from "@/data/keyboards";
import {
  getRankedKeyboards,
  type RankingSort,
} from "@/lib/rankings";
import type { Keyboard } from "@/types";
import { useAvailabilityLookup } from "@/components/providers/AvailabilityProvider";
import { RankingRow } from "./RankingRow";

const sortOptions: { value: RankingSort; label: string }[] = [
  { value: "speed", label: "Speed score" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest first" },
];

type StockFilter = "any" | "available";

interface RankingsListProps {
  catalogKeyboards?: Keyboard[];
}

function uniqueLayouts(boards: Keyboard[]): string[] {
  return [...new Set(boards.map((board) => board.stats.layout))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function RankingsList({ catalogKeyboards }: RankingsListProps) {
  const [sort, setSort] = useState<RankingSort>("speed");
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState("all");
  const [rapidTriggerOnly, setRapidTriggerOnly] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>("any");
  const { getStatus } = useAvailabilityLookup();
  const keyboards = catalogKeyboards ?? staticKeyboards;
  const layouts = useMemo(() => uniqueLayouts(keyboards), [keyboards]);

  const ranked = useMemo(
    () => getRankedKeyboards(keyboards, sort),
    [keyboards, sort],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return ranked.filter((keyboard) => {
      if (layout !== "all" && keyboard.stats.layout !== layout) {
        return false;
      }

      if (rapidTriggerOnly && !keyboard.stats.rapidTrigger) {
        return false;
      }

      if (stockFilter === "available") {
        const status = getStatus(keyboard.id);
        if (status !== "in_stock" && status !== "limited") {
          return false;
        }
      }

      if (!needle) {
        return true;
      }

      const haystack = [
        keyboard.name,
        keyboard.brandId,
        keyboard.tagline,
        keyboard.stats.switchType,
        keyboard.stats.layout,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [
    ranked,
    query,
    layout,
    rapidTriggerOnly,
    stockFilter,
    getStatus,
  ]);

  const filtersActive =
    query.trim().length > 0 ||
    layout !== "all" ||
    rapidTriggerOnly ||
    stockFilter !== "any";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-text-muted">
            {filtered.length} of {ranked.length} keyboards
            {sort === "speed" && !filtersActive ? " ranked by composite speed score" : ""}
            {filtersActive ? " match your filters" : ""}
          </p>

          <label className="flex items-center gap-3 text-sm">
            <span id="rankings-sort-label" className="text-text-muted">
              Sort by
            </span>
            <select
              id="rankings-sort"
              aria-labelledby="rankings-sort-label"
              value={sort}
              onChange={(event) => setSort(event.target.value as RankingSort)}
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

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-bg-surface/60 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-sm sm:min-w-[16rem]">
            <span className="text-text-muted">Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, brand, switch…"
              className="rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary outline-none placeholder:text-text-muted focus:border-solana-purple/50"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Layout</span>
            <select
              value={layout}
              onChange={(event) => setLayout(event.target.value)}
              className="rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-solana-purple/50"
            >
              <option value="all">All layouts</option>
              {layouts.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Stock</span>
            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value as StockFilter)
              }
              className="rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-solana-purple/50"
            >
              <option value="any">Any stock</option>
              <option value="available">In stock / limited</option>
            </select>
          </label>

          <label className="mt-1 flex items-center gap-2 text-sm text-text-primary sm:mt-6">
            <input
              type="checkbox"
              checked={rapidTriggerOnly}
              onChange={(event) => setRapidTriggerOnly(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-bg-primary accent-solana-purple"
            />
            Rapid trigger only
          </label>

          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLayout("all");
                setRapidTriggerOnly(false);
                setStockFilter("any");
              }}
              className="text-sm text-solana-green underline-offset-2 hover:underline sm:mt-6"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((keyboard) => (
          <RankingRow key={keyboard.id} keyboard={keyboard} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-text-muted">
          No keyboards match these filters. Try clearing search or stock
          constraints.
        </p>
      ) : null}
    </div>
  );
}

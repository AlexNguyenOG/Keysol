"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { brands } from "@/data/brands";
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

function parseSort(value: string | null): RankingSort {
  if (
    value === "speed" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "newest"
  ) {
    return value;
  }
  return "speed";
}

function parseStock(value: string | null): StockFilter {
  return value === "available" ? "available" : "any";
}

function brandName(brandId: string): string {
  return brands.find((brand) => brand.id === brandId)?.name ?? brandId;
}

export function RankingsList({ catalogKeyboards }: RankingsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getStatus } = useAvailabilityLookup();
  const keyboards = catalogKeyboards ?? staticKeyboards;
  const layouts = useMemo(() => uniqueLayouts(keyboards), [keyboards]);

  const sort = parseSort(searchParams.get("sort"));
  const layout = searchParams.get("layout") ?? "all";
  const brand = searchParams.get("brand") ?? "all";
  const stockFilter = parseStock(searchParams.get("stock"));
  const rapidTriggerOnly = searchParams.get("rt") === "1";
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const replaceParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const next = params.toString();
      if (next === searchParams.toString()) {
        return;
      }

      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      replaceParams({ q: trimmed || null });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, urlQuery, replaceParams]);

  const ranked = useMemo(
    () => getRankedKeyboards(keyboards, sort),
    [keyboards, sort],
  );

  const filtered = useMemo(() => {
    const needle = urlQuery.trim().toLowerCase();

    return ranked.filter((keyboard) => {
      if (brand !== "all" && keyboard.brandId !== brand) {
        return false;
      }

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
        brandName(keyboard.brandId),
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
    urlQuery,
    brand,
    layout,
    rapidTriggerOnly,
    stockFilter,
    getStatus,
  ]);

  const filtersActive =
    urlQuery.trim().length > 0 ||
    brand !== "all" ||
    layout !== "all" ||
    rapidTriggerOnly ||
    stockFilter !== "any";

  const clearFilters = () => {
    setQuery("");
    replaceParams({
      q: null,
      brand: null,
      layout: null,
      stock: null,
      rt: null,
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-text-muted">
            {filtered.length} of {ranked.length} keyboards
            {sort === "speed" && !filtersActive
              ? " ranked by composite speed score"
              : ""}
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
              onChange={(event) =>
                replaceParams({
                  sort:
                    event.target.value === "speed"
                      ? null
                      : event.target.value,
                })
              }
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
              id="rankings-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, brand, switch…"
              className="rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary outline-none placeholder:text-text-muted focus:border-solana-purple/50"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Brand</span>
            <select
              id="rankings-brand"
              value={brand}
              onChange={(event) =>
                replaceParams({
                  brand:
                    event.target.value === "all" ? null : event.target.value,
                })
              }
              className="rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-solana-purple/50"
            >
              <option value="all">All brands</option>
              {brands.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Layout</span>
            <select
              id="rankings-layout"
              value={layout}
              onChange={(event) =>
                replaceParams({
                  layout:
                    event.target.value === "all" ? null : event.target.value,
                })
              }
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
              id="rankings-stock"
              value={stockFilter}
              onChange={(event) =>
                replaceParams({
                  stock:
                    event.target.value === "any" ? null : event.target.value,
                })
              }
              className="rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-solana-purple/50"
            >
              <option value="any">Any stock</option>
              <option value="available">In stock / limited</option>
            </select>
          </label>

          <label className="mt-1 flex items-center gap-2 text-sm text-text-primary sm:mt-6">
            <input
              id="rankings-rt"
              type="checkbox"
              checked={rapidTriggerOnly}
              onChange={(event) =>
                replaceParams({ rt: event.target.checked ? "1" : null })
              }
              className="h-4 w-4 rounded border-white/20 bg-bg-primary accent-solana-purple"
            />
            Rapid trigger only
          </label>

          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
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
        <div className="mt-8 rounded-2xl border border-white/10 bg-bg-surface/50 px-6 py-10 text-center">
          <p className="text-sm text-text-muted">
            No keyboards match these filters. Try clearing search or stock
            constraints.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-medium text-solana-green underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

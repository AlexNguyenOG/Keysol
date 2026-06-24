"use client";

import { useMemo, useState } from "react";
import { keyboards as staticKeyboards } from "@/data/keyboards";
import {
  getRankedKeyboards,
  type RankingSort,
} from "@/lib/rankings";
import type { Keyboard } from "@/types";
import { RankingRow } from "./RankingRow";

const sortOptions: { value: RankingSort; label: string }[] = [
  { value: "speed", label: "Speed score" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest first" },
];

interface RankingsListProps {
  catalogKeyboards?: Keyboard[];
}

export function RankingsList({ catalogKeyboards }: RankingsListProps) {
  const [sort, setSort] = useState<RankingSort>("speed");
  const keyboards = catalogKeyboards ?? staticKeyboards;

  const ranked = useMemo(
    () => getRankedKeyboards(keyboards, sort),
    [keyboards, sort],
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          {ranked.length} keyboards ranked
          {sort === "speed" && " by composite speed score"}
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

      <div className="space-y-4">
        {ranked.map((keyboard) => (
          <RankingRow key={keyboard.id} keyboard={keyboard} />
        ))}
      </div>
    </div>
  );
}

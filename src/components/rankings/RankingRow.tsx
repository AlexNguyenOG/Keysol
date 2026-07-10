"use client";

import type { RankedKeyboard } from "@/lib/rankings";
import { KeyboardShowcaseMedia } from "@/components/ui/KeyboardShowcaseMedia";
import { getBrandName } from "@/lib/keyboards";
import {
  formatPollingRate,
  formatPrice,
  formatReleaseDate,
} from "@/lib/format";
import { useAvailability } from "@/components/providers/AvailabilityProvider";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { PurchaseLink } from "@/components/ui/PurchaseLink";

interface RankingRowProps {
  keyboard: RankedKeyboard;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple to-solana-green text-sm font-bold text-bg-primary">
        {rank}
      </span>
    );
  }

  if (rank <= 3) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-solana-green/40 bg-solana-green/10 text-sm font-bold text-solana-green">
        {rank}
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-text-muted">
      {rank}
    </span>
  );
}

export function RankingRow({ keyboard }: RankingRowProps) {
  const brandName = getBrandName(keyboard.brandId);
  const { status, checkedAt, loading } = useAvailability(keyboard.id);

  return (
    <article className="gradient-border rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <RankBadge rank={keyboard.rank} />

          <KeyboardShowcaseMedia
            keyboardId={keyboard.id}
            imageSrc={keyboard.image}
            alt={`${keyboard.name} product photo`}
            className="h-20 w-32 shrink-0 rounded-lg sm:h-24 sm:w-36"
            mediaInset="lg"
            sizes="144px"
          />

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-solana-purple">
              {brandName}
            </p>
            <h3 className="truncate font-semibold text-text-primary">
              {keyboard.name}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Score{" "}
              <span className="font-semibold text-solana-green">
                {keyboard.score}/100
              </span>
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="text-xs font-medium uppercase tracking-wider text-solana-purple">
            {brandName}
          </p>
          <h3 className="text-lg font-semibold text-text-primary">
            {keyboard.name}
          </h3>
          <p className="mt-1 text-sm text-text-muted">{keyboard.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          <div className="rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2">
            <p className="text-xs text-text-muted">Speed score</p>
            <p className="text-sm font-semibold text-solana-green">
              {keyboard.score}/100
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2">
            <p className="text-xs text-text-muted">Polling</p>
            <p className="text-sm font-medium text-text-primary">
              {formatPollingRate(keyboard.stats.pollingRateHz)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2">
            <p className="text-xs text-text-muted">Actuation</p>
            <p className="text-sm font-medium text-text-primary">
              {keyboard.stats.actuationPointMm} mm
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2">
            <p className="text-xs text-text-muted">MSRP</p>
            <p className="text-sm font-medium text-text-primary">
              {formatPrice(keyboard.priceUsd)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2">
            <p className="text-xs text-text-muted">Released</p>
            <p className="text-sm font-medium text-text-primary">
              {formatReleaseDate(keyboard.releaseDate)}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-text-muted lg:hidden">{keyboard.tagline}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AvailabilityBadge status={status} loading={loading} checkedAt={checkedAt} />
        <PurchaseLink
          href={keyboard.purchaseUrl}
          keyboardName={keyboard.name}
          availabilityStatus={status}
          loading={loading}
          className="w-full sm:w-auto"
        />
      </div>

      <ScoreBreakdown breakdown={keyboard.scoreBreakdown} />
    </article>
  );
}

"use client";

import type { RankedKeyboard } from "@/lib/rankings";
import { getBrandName } from "@/lib/keyboards";
import { useAvailability } from "@/components/providers/AvailabilityProvider";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { PurchaseLink } from "@/components/ui/PurchaseLink";

interface RankingsPreviewCardProps {
  keyboard: RankedKeyboard;
}

export function RankingsPreviewCard({ keyboard }: RankingsPreviewCardProps) {
  const { status, checkedAt, loading } = useAvailability(keyboard.id);

  return (
    <li className="gradient-border rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
            keyboard.rank === 1
              ? "bg-gradient-to-br from-solana-purple to-solana-green text-bg-primary"
              : "border border-solana-green/40 bg-solana-green/10 text-solana-green"
          }`}
        >
          #{keyboard.rank}
        </span>
        <span className="text-sm font-semibold text-solana-green">
          {keyboard.score}/100
        </span>
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-solana-purple">
        {getBrandName(keyboard.brandId)}
      </p>
      <h3 className="mt-1 font-semibold text-text-primary">{keyboard.name}</h3>
      <p className="mt-2 text-sm text-text-muted">{keyboard.tagline}</p>
      <AvailabilityBadge
        status={status}
        loading={loading}
        checkedAt={checkedAt}
        className="mt-3"
      />
      <PurchaseLink
        href={keyboard.purchaseUrl}
        keyboardName={keyboard.name}
        availabilityStatus={status}
        loading={loading}
        className="mt-4 w-full"
      />
    </li>
  );
}

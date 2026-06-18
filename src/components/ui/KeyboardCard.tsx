"use client";

import Image from "next/image";
import type { Keyboard } from "@/types";
import {
  formatPollingRate,
  formatPrice,
  formatReleaseDate,
} from "@/lib/format";
import { useAvailability } from "@/components/providers/AvailabilityProvider";
import { getSwitchTypeForKeyboard } from "@/data/switch-types";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { PurchaseLink } from "./PurchaseLink";
import { SwitchSensoryNote } from "./SwitchSensoryNote";

interface KeyboardCardProps {
  keyboard: Keyboard;
}

interface StatItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd
        className={`mt-0.5 text-sm font-medium ${highlight ? "text-solana-green" : "text-text-primary"}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function KeyboardCard({ keyboard }: KeyboardCardProps) {
  const { stats } = keyboard;
  const badge = keyboard.badge ?? "Fastest";
  const switchProfile = getSwitchTypeForKeyboard(keyboard.id);
  const { status, checkedAt, loading } = useAvailability(keyboard.id);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-bg-primary/40">
      <div className="relative aspect-[16/10] w-full bg-[#0a0b0f]">
        <Image
          src={keyboard.image}
          alt={`${keyboard.name} product photo`}
          fill
          className="object-contain p-1.5"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-text-primary">{keyboard.name}</h4>
            <p className="mt-0.5 text-xs text-text-muted">{keyboard.tagline}</p>
          </div>
          <span className="shrink-0 rounded-full bg-solana-purple/20 px-2.5 py-1 text-xs font-medium text-solana-purple">
            {badge}
          </span>
        </div>

        <AvailabilityBadge
          status={status}
          loading={loading}
          checkedAt={checkedAt}
          className="mb-3"
        />

        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-text-muted">
            Released{" "}
            <span className="text-text-primary">
              {formatReleaseDate(keyboard.releaseDate)}
            </span>
          </span>
          <span className="text-text-muted">
            MSRP{" "}
            <span className="font-medium text-solana-green">
              {formatPrice(keyboard.priceUsd)}
            </span>
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatItem label="Switch" value={stats.switchType} />
          <StatItem label="Layout" value={stats.layout} />
          <StatItem
            label="Connectivity"
            value={stats.connectivity.join(", ")}
          />
          <StatItem
            label="Actuation"
            value={`${stats.actuationPointMm} mm`}
            highlight
          />
          <StatItem
            label="Polling rate"
            value={formatPollingRate(stats.pollingRateHz)}
            highlight
          />
          <StatItem
            label="Response time"
            value={`${stats.responseTimeMs} ms`}
            highlight
          />
          <StatItem label="Key travel" value={`${stats.keyTravelMm} mm`} />
          <StatItem
            label="Rapid trigger"
            value={stats.rapidTrigger ? "Yes" : "No"}
            highlight={stats.rapidTrigger}
          />
        </dl>

        {switchProfile && (
          <SwitchSensoryNote entry={switchProfile} className="mt-3" />
        )}

        <PurchaseLink
          href={keyboard.purchaseUrl}
          keyboardName={keyboard.name}
          availabilityStatus={status}
          loading={loading}
          className="mt-4 w-full"
        />
      </div>
    </div>
  );
}

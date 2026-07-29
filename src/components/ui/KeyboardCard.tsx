"use client";

import type { Keyboard } from "@/types";
import { KeyboardShowcaseMedia } from "./KeyboardShowcaseMedia";
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
  /** Full card for featured views; compact for dense brand lists. */
  variant?: "full" | "compact";
}

interface StatItemProps {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}

function StatItem({ label, value, highlight, className = "" }: StatItemProps) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2 ${className}`}
    >
      <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-medium leading-snug ${highlight ? "text-solana-green" : "text-text-primary"}`}
        title={value}
      >
        <span className="line-clamp-2">{value}</span>
      </dd>
    </div>
  );
}

function KeyboardMeta({
  keyboard,
  status,
  loading,
  checkedAt,
}: {
  keyboard: Keyboard;
  status: ReturnType<typeof useAvailability>["status"];
  loading: boolean;
  checkedAt: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <AvailabilityBadge
        status={status}
        loading={loading}
        checkedAt={checkedAt ?? undefined}
        className="w-fit"
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
        <span>
          MSRP{" "}
          <span className="font-medium text-solana-green">
            {formatPrice(keyboard.priceUsd)}
          </span>
        </span>
        <span>
          Released{" "}
          <span className="text-text-primary">
            {formatReleaseDate(keyboard.releaseDate)}
          </span>
        </span>
      </div>
    </div>
  );
}

export function KeyboardCard({ keyboard, variant = "full" }: KeyboardCardProps) {
  const { stats } = keyboard;
  const badge = keyboard.badge ?? "Fastest";
  const switchProfile = getSwitchTypeForKeyboard(keyboard.id);
  const { status, checkedAt, loading } = useAvailability(keyboard.id);

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-bg-primary/40 p-3 sm:flex-row sm:items-stretch">
        <KeyboardShowcaseMedia
          keyboardId={keyboard.id}
          imageSrc={keyboard.image}
          alt={`${keyboard.name} product photo`}
          className="aspect-[16/10] w-full shrink-0 rounded-lg sm:aspect-auto sm:h-28 sm:w-36"
          mediaInset="md"
          sizes="144px"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate font-semibold text-text-primary">
                {keyboard.name}
              </h4>
              <p className="line-clamp-1 text-xs text-text-muted">
                {keyboard.tagline}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-solana-purple/20 px-2 py-0.5 text-[10px] font-medium text-solana-purple">
              {badge}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-text-muted">Polling</dt>
              <dd className="truncate font-medium text-solana-green">
                {formatPollingRate(stats.pollingRateHz)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-text-muted">Actuation</dt>
              <dd className="truncate font-medium text-text-primary">
                {stats.actuationPointMm} mm
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-text-muted">Layout</dt>
              <dd className="truncate font-medium text-text-primary">
                {stats.layout}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-text-muted">Rapid trigger</dt>
              <dd className="truncate font-medium text-text-primary">
                {stats.rapidTrigger ? "Yes" : "No"}
              </dd>
            </div>
          </dl>

          <PurchaseLink
            href={keyboard.purchaseUrl}
            keyboardName={keyboard.name}
            availabilityStatus={status}
            loading={loading}
            className="mt-auto w-full max-w-full whitespace-normal text-center leading-snug"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-bg-primary/40">
      <KeyboardShowcaseMedia
        keyboardId={keyboard.id}
        imageSrc={keyboard.image}
        alt={`${keyboard.name} product photo`}
        className="aspect-[16/9] min-h-[220px] w-full sm:min-h-[280px]"
        mediaInset="sm"
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-lg font-semibold text-text-primary">
              {keyboard.name}
            </h4>
            <p className="mt-1 line-clamp-2 text-sm text-text-muted">
              {keyboard.tagline}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-solana-purple/20 px-2.5 py-1 text-xs font-medium text-solana-purple">
            {badge}
          </span>
        </div>

        <KeyboardMeta
          keyboard={keyboard}
          status={status}
          loading={loading}
          checkedAt={checkedAt}
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-solana-green">
            Performance
          </p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
            <StatItem
              label="Actuation"
              value={`${stats.actuationPointMm} mm`}
              highlight
            />
            <StatItem
              label="Rapid trigger"
              value={stats.rapidTrigger ? "Yes" : "No"}
              highlight={stats.rapidTrigger}
            />
          </dl>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-solana-purple">
            Build & layout
          </p>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatItem label="Switch" value={stats.switchType} className="sm:col-span-3" />
            <StatItem label="Layout" value={stats.layout} />
            <StatItem
              label="Key travel"
              value={`${stats.keyTravelMm} mm`}
            />
            <StatItem
              label="Connectivity"
              value={stats.connectivity.join(", ")}
              className="sm:col-span-3"
            />
          </dl>
        </div>

        {switchProfile && <SwitchSensoryNote entry={switchProfile} />}

        <PurchaseLink
          href={keyboard.purchaseUrl}
          keyboardName={keyboard.name}
          availabilityStatus={status}
          loading={loading}
          className="w-full"
        />
      </div>
    </div>
  );
}

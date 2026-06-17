"use client";

import {
  AVAILABILITY_LABELS,
  AVAILABILITY_STYLES,
  formatCheckedAt,
} from "@/lib/availability/labels";
import type { AvailabilityStatus } from "@/lib/availability/types";

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus;
  loading?: boolean;
  checkedAt?: string;
  className?: string;
}

export function AvailabilityBadge({
  status = "unknown",
  loading = false,
  checkedAt,
  className = "",
}: AvailabilityBadgeProps) {
  if (loading) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-text-muted ${className}`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted" />
        Checking stock…
      </span>
    );
  }

  const styles = AVAILABILITY_STYLES[status];
  const label = AVAILABILITY_LABELS[status];
  const checkedLabel = formatCheckedAt(checkedAt);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles.badge} ${className}`}
      title={checkedLabel ? `Last checked ${checkedLabel}` : undefined}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {label}
      {checkedLabel ? (
        <span className="font-normal opacity-70">· {checkedLabel}</span>
      ) : null}
    </span>
  );
}

import type { AvailabilityStatus } from "@/lib/availability/types";

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  limited: "Limited stock",
  unknown: "Stock unknown",
};

export const AVAILABILITY_STYLES: Record<
  AvailabilityStatus,
  { badge: string; dot: string }
> = {
  in_stock: {
    badge: "border-solana-green/30 bg-solana-green/10 text-solana-green",
    dot: "bg-solana-green",
  },
  out_of_stock: {
    badge: "border-red-400/30 bg-red-400/10 text-red-300",
    dot: "bg-red-400",
  },
  limited: {
    badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
  unknown: {
    badge: "border-white/10 bg-white/5 text-text-muted",
    dot: "bg-text-muted",
  },
};

export function formatCheckedAt(iso: string | undefined): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return null;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

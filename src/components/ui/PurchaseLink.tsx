import type { AvailabilityStatus } from "@/lib/availability/types";

interface PurchaseLinkProps {
  href: string;
  keyboardName: string;
  className?: string;
  availabilityStatus?: AvailabilityStatus;
  loading?: boolean;
}

function buttonLabel(
  keyboardName: string,
  status?: AvailabilityStatus,
): string {
  if (status === "out_of_stock") {
    return `Check store — ${keyboardName}`;
  }

  return `Buy ${keyboardName}`;
}

export function PurchaseLink({
  href,
  keyboardName,
  className = "",
  availabilityStatus,
  loading = false,
}: PurchaseLinkProps) {
  const safeHref = href.startsWith("https://") ? href : undefined;
  const outOfStock = availabilityStatus === "out_of_stock";
  const unknown = !availabilityStatus || availabilityStatus === "unknown";

  const baseStyles =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity";

  const enabledStyles =
    "bg-gradient-to-r from-solana-purple to-solana-green text-bg-primary hover:opacity-90";

  const mutedStyles =
    "border border-white/15 bg-white/5 text-text-primary hover:bg-white/10";

  const loadingStyles = "border border-white/10 bg-white/5 text-text-muted";

  const styles = loading
    ? loadingStyles
    : outOfStock || unknown
      ? mutedStyles
      : enabledStyles;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={loading || !safeHref ? true : undefined}
      className={`${baseStyles} ${styles} ${className} ${!safeHref ? "pointer-events-none opacity-50" : ""}`}
    >
      {loading
        ? "Loading stock…"
        : !safeHref
          ? "Link unavailable"
          : buttonLabel(keyboardName, availabilityStatus)}
    </a>
  );
}

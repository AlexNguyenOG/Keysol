import {
  VALUE_TREND_LABELS,
  type ValueTrend,
} from "@/lib/tokens/trend";

const valueTrendStyles: Record<ValueTrend, string> = {
  rising:
    "border-solana-green/40 bg-solana-green/10 text-solana-green hover:bg-solana-green/15",
  stable: "border-white/15 bg-white/5 text-text-muted hover:bg-white/10",
  dropping:
    "border-red-400/40 bg-red-400/10 text-red-400 hover:bg-red-400/15",
};

export function ValueTrendBadge({ trend }: { trend: ValueTrend }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${valueTrendStyles[trend]}`}
    >
      {VALUE_TREND_LABELS[trend]}
    </span>
  );
}

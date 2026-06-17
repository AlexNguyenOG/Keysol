import type { BrandCategory } from "@/types";

const categoryStyles: Record<BrandCategory, string> = {
  gaming: "bg-solana-purple/20 text-solana-purple border-solana-purple/30",
  enthusiast: "bg-solana-green/20 text-solana-green border-solana-green/30",
  productivity: "bg-white/10 text-text-muted border-white/20",
};

const categoryLabels: Record<BrandCategory, string> = {
  gaming: "Gaming",
  enthusiast: "Enthusiast",
  productivity: "Productivity",
};

interface BadgeProps {
  category: BrandCategory;
}

export function Badge({ category }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${categoryStyles[category]}`}
    >
      {categoryLabels[category]}
    </span>
  );
}

import type { Brand } from "@/types";
import { Badge } from "./Badge";
import { BrandIcon } from "./BrandIcon";

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <article className="gradient-border group flex flex-col rounded-2xl p-6 transition-transform hover:-translate-y-1">
      <div className="mb-4 flex items-start justify-between gap-3">
        <BrandIcon brandId={brand.id} name={brand.name} />
        <Badge category={brand.category} />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-text-primary">
        {brand.name}
      </h3>
      <p className="mb-4 text-sm text-text-muted">{brand.tagline}</p>

      <ul className="mb-6 flex-1 space-y-2">
        {brand.highlights.map((highlight) => (
          <li
            key={highlight}
            className="flex items-start gap-2 text-sm text-text-muted"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-solana-green" />
            {highlight}
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-text-muted opacity-60"
      >
        View keyboards (soon)
      </button>
    </article>
  );
}

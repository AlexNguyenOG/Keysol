import type { Brand } from "@/types";
import { getKeyboardsByBrandIdSorted } from "@/lib/catalog.server";
import { Badge } from "./Badge";
import { BrandIcon } from "./BrandIcon";
import { BrandKeyboardList } from "./BrandKeyboardList";

interface BrandCardProps {
  brand: Brand;
}

const MAX_VISIBLE_KEYBOARDS = 3;

export function BrandCard({ brand }: BrandCardProps) {
  const brandKeyboards = getKeyboardsByBrandIdSorted(brand.id);
  const visible = brandKeyboards.slice(0, MAX_VISIBLE_KEYBOARDS);
  const remaining = brandKeyboards.length - visible.length;

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

      <ul className="mb-6 space-y-2">
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

      {visible.length > 0 && (
        <BrandKeyboardList
          brandName={brand.name}
          keyboards={visible}
          remaining={remaining}
        />
      )}
    </article>
  );
}

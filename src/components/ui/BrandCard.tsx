import type { Brand } from "@/types";
import { getKeyboardsByBrandId } from "@/lib/keyboards";
import { Badge } from "./Badge";
import { BrandIcon } from "./BrandIcon";
import { KeyboardCard } from "./KeyboardCard";

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  const brandKeyboards = getKeyboardsByBrandId(brand.id);

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

      {brandKeyboards.length > 0 && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Fastest keyboards
          </p>
          {brandKeyboards.map((keyboard) => (
            <KeyboardCard key={keyboard.id} keyboard={keyboard} />
          ))}
        </div>
      )}
    </article>
  );
}

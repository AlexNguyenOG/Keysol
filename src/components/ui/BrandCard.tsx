import Link from "next/link";
import type { Brand } from "@/types";
import { getKeyboardsByBrandIdSorted } from "@/lib/catalog.server";
import { Badge } from "./Badge";
import { BrandIcon } from "./BrandIcon";
import { KeyboardCard } from "./KeyboardCard";

interface BrandCardProps {
  brand: Brand;
}

const MAX_FEATURED_KEYBOARDS = 1;
const MAX_COMPACT_KEYBOARDS = 2;

export function BrandCard({ brand }: BrandCardProps) {
  const brandKeyboards = getKeyboardsByBrandIdSorted(brand.id);
  const featured = brandKeyboards.slice(0, MAX_FEATURED_KEYBOARDS);
  const compact = brandKeyboards.slice(
    MAX_FEATURED_KEYBOARDS,
    MAX_FEATURED_KEYBOARDS + MAX_COMPACT_KEYBOARDS,
  );
  const remaining = brandKeyboards.length - featured.length - compact.length;

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
        <div className="space-y-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Fastest keyboards
            </p>
            <span className="text-xs text-text-muted">
              {brandKeyboards.length} in catalog
            </span>
          </div>

          {featured.map((keyboard) => (
            <KeyboardCard key={keyboard.id} keyboard={keyboard} variant="full" />
          ))}

          {compact.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Also from {brand.name}
              </p>
              {compact.map((keyboard) => (
                <KeyboardCard
                  key={keyboard.id}
                  keyboard={keyboard}
                  variant="compact"
                />
              ))}
            </div>
          )}

          {remaining > 0 && (
            <p className="text-center text-sm text-text-muted">
              +{remaining} more {brand.name} keyboard
              {remaining === 1 ? "" : "s"} on{" "}
              <Link
                href="/rankings"
                className="text-solana-green underline-offset-2 hover:underline"
              >
                rankings
              </Link>
            </p>
          )}
        </div>
      )}
    </article>
  );
}

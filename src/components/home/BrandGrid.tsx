import { brands } from "@/data/brands";
import { BrandCard } from "@/components/ui/BrandCard";

function brandGridItemClass(index: number, total: number) {
  const isLoneLastBrand = index === total - 1 && total % 2 !== 0;

  if (isLoneLastBrand) {
    return "lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-3xl";
  }

  return "";
}

export function BrandGrid() {
  return (
    <section id="brands" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top Keyboard Brands
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-muted">
            From hall-effect pioneers to esports legends — each brand&apos;s
            fastest boards with pricing, release dates, and performance stats.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              className={brandGridItemClass(index, brands.length)}
            >
              <BrandCard brand={brand} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

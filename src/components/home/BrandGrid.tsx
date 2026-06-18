import { brands } from "@/data/brands";
import { BrandCard } from "@/components/ui/BrandCard";
import { SwitchTypesGuide } from "@/components/home/SwitchTypesGuide";

const leftColumnBrands = brands.filter((_, index) => index % 2 === 0);
const rightColumnBrands = brands.filter((_, index) => index % 2 === 1);

export function BrandGrid() {
  return (
    <section id="brands" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top Keyboard Brands
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-muted">
            From hall-effect pioneers to esports legends — explore each
            brand&apos;s fastest keyboard with pricing, release dates, and
            performance stats.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:hidden">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
          <SwitchTypesGuide variant="full" />
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-2 lg:items-start xl:hidden">
          <div className="flex flex-col gap-6">
            {leftColumnBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
          <div className="flex flex-col gap-6">
            {rightColumnBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </div>

        <div className="hidden gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] xl:items-start">
          <div className="flex flex-col gap-6">
            {leftColumnBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
          <div className="flex flex-col gap-6">
            {rightColumnBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
          <SwitchTypesGuide
            variant="sidebar"
            className="sticky top-24 self-start"
          />
        </div>

        <div className="mt-6 hidden lg:block xl:hidden">
          <SwitchTypesGuide variant="full" />
        </div>
      </div>
    </section>
  );
}

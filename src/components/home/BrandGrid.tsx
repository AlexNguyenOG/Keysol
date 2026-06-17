import { brands } from "@/data/brands";
import { BrandCard } from "@/components/ui/BrandCard";

export function BrandGrid() {
  return (
    <section id="brands" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top Keyboard Brands
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-muted">
            From hall-effect pioneers to esports legends — explore the brands
            shaping how we type and play.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}

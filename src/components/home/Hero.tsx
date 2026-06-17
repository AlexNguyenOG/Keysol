import { GradientText } from "@/components/ui/GradientText";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div
        className="glow-orb glow-orb-purple -left-32 top-0 h-96 w-96"
        aria-hidden="true"
      />
      <div
        className="glow-orb glow-orb-green -right-32 top-32 h-80 w-80"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-solana-green">
          Keyboard Discovery
        </p>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Find the world&apos;s{" "}
          <GradientText as="span">best keyboards</GradientText>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
          An unbiased guide across gaming, productivity, and enthusiast boards.
          Compare top brands like Wooting, Razer, Corsair, and more — all in one
          place.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#brands"
            className="w-full rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-8 py-3 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 sm:w-auto"
          >
            Explore Brands
          </a>
          <span className="w-full cursor-not-allowed rounded-lg border border-white/10 px-8 py-3 text-sm font-medium text-text-muted/50 sm:w-auto">
            View Rankings (soon)
          </span>
        </div>
      </div>
    </section>
  );
}

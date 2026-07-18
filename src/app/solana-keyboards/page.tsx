import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SOLANA_KEYBOARD } from "@/components/layout/nav-links";
import { GradientText } from "@/components/ui/GradientText";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Solana Keyboards — KeySol",
  description:
    "The Solana x Thock King TK65 Pro — limited Foundation collab mechanical keyboard with Solana gradient legends.",
};

export default function SolanaKeyboardsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="glow-orb glow-orb-purple -left-24 top-10 h-80 w-80"
            aria-hidden="true"
          />
          <div
            className="glow-orb glow-orb-green -right-20 bottom-0 h-72 w-72"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
            <div>
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-solana-green">
                Official Collab for Thock King x Solana
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                <GradientText as="span">Solana</GradientText> Keyboards
              </h1>
              <p className="mt-4 max-w-xl text-lg text-text-muted">
                {SOLANA_KEYBOARD.tagline}
              </p>

              <ul className="mt-8 space-y-3">
                {SOLANA_KEYBOARD.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2 text-sm text-text-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-solana-green" />
                    {highlight}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href={SOLANA_KEYBOARD.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-8 py-3 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90"
                >
                  Buy on Thock King · {formatPrice(SOLANA_KEYBOARD.priceUsd)}
                </a>
                <Link
                  href="/rankings"
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 px-8 py-3 text-sm font-medium text-text-primary transition-colors hover:border-solana-purple/40 hover:bg-white/5"
                >
                  Compare all boards
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b0f]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={SOLANA_KEYBOARD.image}
                  alt={`${SOLANA_KEYBOARD.name} product photo`}
                  fill
                  priority
                  className="object-contain p-4 sm:p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="border-t border-white/10 px-5 py-4">
                <p className="text-lg font-semibold text-text-primary">
                  {SOLANA_KEYBOARD.name}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Solana Foundation × Thock King · limited run
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ValueTrendsExplainer } from "@/components/value-trends/ValueTrendsExplainer";
import { ValueTrendsList } from "@/components/value-trends/ValueTrendsList";
import { GradientText } from "@/components/ui/GradientText";

export const metadata: Metadata = {
  title: "Value Trends — KeySol",
  description:
    "Track which keyboard tokens are rising, stable, or dropping based on live retailer stock and catalog scores.",
};

export default function ValueTrendsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-solana-green">
              Market signals
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Value <GradientText as="span">Trends</GradientText>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-text-muted">
              See which keyboard tokens are gaining or losing value as retailer
              stock changes — Rising in green, Stable in gray, Dropping in red.
            </p>
          </div>

          <ValueTrendsExplainer />
          <ValueTrendsList />
        </div>
      </main>
      <Footer />
    </>
  );
}

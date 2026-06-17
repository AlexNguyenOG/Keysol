import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { BrandGrid } from "@/components/home/BrandGrid";
import { RankingsPreview } from "@/components/home/RankingsPreview";
import { WhySection } from "@/components/home/WhySection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BrandGrid />
        <RankingsPreview />
        <WhySection />
      </main>
      <Footer />
    </>
  );
}

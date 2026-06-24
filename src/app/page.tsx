import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { FeaturedDropSection } from "@/components/home/FeaturedDropSection";
import { BrandGrid } from "@/components/home/BrandGrid";
import { RankingsPreview } from "@/components/home/RankingsPreview";
import { SwitchTypesGuideSection } from "@/components/home/SwitchTypesGuideSection";
import { TokenComingSoon } from "@/components/home/TokenComingSoon";
import { WhySection } from "@/components/home/WhySection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeaturedDropSection />
        <BrandGrid />
        <RankingsPreview />
        <SwitchTypesGuideSection />
        <TokenComingSoon />
        <WhySection />
      </main>
      <Footer />
    </>
  );
}

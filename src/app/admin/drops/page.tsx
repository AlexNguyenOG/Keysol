import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DropsAdminClient } from "@/components/admin/DropsAdminClient";
import { GradientText } from "@/components/ui/GradientText";

export const metadata: Metadata = {
  title: "Drop Admin — KeySol",
  robots: { index: false, follow: false },
};

export default function AdminDropsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-solana-purple">
              Admin
            </p>
            <h1 className="text-4xl font-bold tracking-tight">
              Keyboard <GradientText as="span">Drop Review</GradientText>
            </h1>
            <p className="mt-3 max-w-2xl text-text-muted">
              Review auto-detected and manual limited-edition candidates before
              they appear on the home page.
            </p>
          </div>

          <DropsAdminClient />
        </div>
      </main>
      <Footer />
    </>
  );
}

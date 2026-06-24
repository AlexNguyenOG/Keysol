import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { GradientText } from "@/components/ui/GradientText";

interface LegalPageShellProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function LegalPageShell({
  eyebrow,
  title,
  children,
}: LegalPageShellProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-solana-green">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              <GradientText as="span">{title}</GradientText>
            </h1>
          </div>

          <div className="gradient-border space-y-6 rounded-2xl p-8 text-sm leading-7 text-text-muted">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

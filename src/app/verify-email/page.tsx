import type { Metadata } from "next";
import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Verify email — KeySol",
  description: "Verify your KeySol account email address.",
};

export default function VerifyEmailPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <VerifyEmailClient />
      </main>
      <Footer />
    </>
  );
}

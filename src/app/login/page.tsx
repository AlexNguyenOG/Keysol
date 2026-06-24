import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Log in — KeySol",
  description: "Log in to your KeySol account.",
};

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="mx-auto h-96 w-full max-w-md" />}>
          <AuthForm mode="login" />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

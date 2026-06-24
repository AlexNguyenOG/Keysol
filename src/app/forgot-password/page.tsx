import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Forgot password — KeySol",
  description: "Reset your KeySol account password.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <ForgotPasswordForm />
      </main>
      <Footer />
    </>
  );
}

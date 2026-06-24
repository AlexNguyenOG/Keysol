import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Reset password — KeySol",
  description: "Choose a new password for your KeySol account.",
};

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <ResetPasswordForm />
      </main>
      <Footer />
    </>
  );
}

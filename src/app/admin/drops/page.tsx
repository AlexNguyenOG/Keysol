import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DropsAdminPanel } from "@/components/admin/DropsAdminPanel";
import { isAdminEmail } from "@/lib/admin";
import { getSessionFromCookies } from "@/lib/auth/session";
import { listDropCandidates } from "@/lib/drops/store";
import { GradientText } from "@/components/ui/GradientText";

export const metadata: Metadata = {
  title: "Drop Admin — KeySol",
  robots: { index: false, follow: false },
};

export default async function AdminDropsPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login?callbackUrl=/admin/drops");
  }

  if (!isAdminEmail(session.email)) {
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-text-primary">Access denied</h1>
            <p className="mt-3 text-text-muted">
              Your account is not on the admin allowlist. Set{" "}
              <code className="text-solana-green">ADMIN_EMAILS</code> to include
              your email.
            </p>
            <Link href="/" className="mt-6 inline-block text-solana-green hover:underline">
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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

          <DropsAdminPanel
            adminEmail={session.email}
            initialCandidates={listDropCandidates("pending")}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

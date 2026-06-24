import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Contact — KeySol",
  description: "Contact KeySol for support, privacy, and security inquiries.",
};

export default function ContactPage() {
  return (
    <LegalPageShell eyebrow="Support" title="Contact">
      <p className="text-text-primary">
        KeySol is a keyboard catalog and discovery project. Use the channels
        below depending on what you need.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">General support</h2>
        <p>
          <a
            href="mailto:hello@keysol.app"
            className="font-medium text-solana-green hover:underline"
          >
            hello@keysol.app
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Privacy</h2>
        <p>
          See the{" "}
          <Link href="/privacy" className="font-medium text-solana-green hover:underline">
            Privacy Policy
          </Link>{" "}
          or email{" "}
          <a
            href="mailto:privacy@keysol.app"
            className="font-medium text-solana-green hover:underline"
          >
            privacy@keysol.app
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Security</h2>
        <p>
          Report vulnerabilities through our{" "}
          <Link href="/security" className="font-medium text-solana-green hover:underline">
            security page
          </Link>{" "}
          or email{" "}
          <a
            href="mailto:security@keysol.app"
            className="font-medium text-solana-green hover:underline"
          >
            security@keysol.app
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}

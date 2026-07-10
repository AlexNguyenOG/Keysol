import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Security — KeySol",
  description: "Responsible disclosure and security practices for KeySol.",
};

export default function SecurityPage() {
  return (
    <LegalPageShell eyebrow="Security" title="Security">
      <p className="text-text-primary">
        We take the security of KeySol seriously and appreciate responsible
        reports from researchers and users.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Reporting a vulnerability
        </h2>
        <p>
          Email{" "}
          <a
            href="mailto:security@keysol.app"
            className="font-medium text-solana-green hover:underline"
          >
            security@keysol.app
          </a>{" "}
          with a clear description, reproduction steps, and impact assessment.
          Please do not test against production systems without permission.
        </p>
        <p>
          Machine-readable disclosure details are also available in{" "}
          <Link href="/.well-known/security.txt" className="font-medium text-solana-green hover:underline">
            /.well-known/security.txt
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          What we protect
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>HTTP security headers and strict transport security in production</li>
          <li>Rate limiting on public APIs</li>
          <li>SSRF guards on server-side retailer fetches</li>
          <li>Bearer-secret protection for admin and cron endpoints</li>
          <li>Dependency scanning in CI and weekly Dependabot updates</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Out of scope</h2>
        <p>
          Social engineering, physical attacks, denial-of-service against
          third-party retailers, and issues in user-controlled environments are
          generally out of scope unless they directly compromise KeySol
          infrastructure or visitor data.
        </p>
      </section>
    </LegalPageShell>
  );
}

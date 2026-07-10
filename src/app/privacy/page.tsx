import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — KeySol",
  description: "How KeySol handles cookies and third-party services.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Privacy Policy">
      <p className="text-text-primary">
        KeySol is a keyboard discovery site. This policy explains what we collect
        and why.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Keyboard assistant
        </h2>
        <p>
          Messages sent to the KeySol assistant may be processed locally or, if
          configured by the site operator, forwarded to OpenAI for response
          generation. Do not submit secrets or sensitive personal data in chat
          messages.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Availability checks
        </h2>
        <p>
          KeySol periodically fetches public retailer product pages listed in
          the catalog to estimate stock status. No personal data is sent in those
          requests.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Contact</h2>
        <p>
          Privacy questions can be sent to{" "}
          <a
            href="mailto:privacy@keysol.app"
            className="font-medium text-solana-green hover:underline"
          >
            privacy@keysol.app
          </a>
          .
        </p>
      </section>

      <p className="text-xs">Last updated: June 2026</p>
    </LegalPageShell>
  );
}

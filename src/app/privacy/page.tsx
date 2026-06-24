import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — KeySol",
  description: "How KeySol handles account data, cookies, and third-party services.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Privacy Policy">
      <p className="text-text-primary">
        KeySol is a keyboard discovery site. This policy explains what we collect
        and why.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Account data</h2>
        <p>
          If you create an account, we store your name, email address, and a
          bcrypt-hashed password in our auth database. We do not store plaintext
          passwords.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Sessions</h2>
        <p>
          Signed-in sessions use HTTP-only cookies with signed tokens. Logout
          revokes the server-side session immediately.
        </p>
      </section>

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
        <h2 className="text-lg font-semibold text-text-primary">Security logs</h2>
        <p>
          Authentication events such as sign-in, sign-up, logout, and password
          resets are recorded in server audit logs for abuse detection. Logs
          include timestamps, event type, and client IP when available.
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

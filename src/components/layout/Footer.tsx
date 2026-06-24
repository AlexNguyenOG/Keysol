import Link from "next/link";
import { AUTHOR_NAME, AUTHOR_WEBSITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-lg font-semibold">
              Key<span className="gradient-text">Sol</span>
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Your guide to the world&apos;s best keyboards.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/value-trends"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Value Trends
            </Link>
            <Link
              href="/tokens"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Token Guide
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Privacy
            </Link>
            <Link
              href="/security"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Security
            </Link>
            <Link
              href="/contact"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Contact
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center">
          <p className="text-base font-medium text-text-muted sm:text-lg">
            Solana-inspired design ·{" "}
            <span className="gradient-text text-lg font-semibold sm:text-xl">
              Keyboard token collectibles coming soon
            </span>
          </p>
          <p className="mt-4 text-sm text-text-muted">
            © 2026-present{" "}
            <a
              href={AUTHOR_WEBSITE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-solana-green underline-offset-2 transition-colors hover:text-text-primary hover:underline"
            >
              {AUTHOR_NAME}
            </a>
            . All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

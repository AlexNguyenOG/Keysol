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

          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-text-muted">
            Built with Solana-inspired design — a visual homage, not a
            blockchain product.
          </p>
        </div>
      </div>
    </footer>
  );
}

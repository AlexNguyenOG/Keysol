import Link from "next/link";

function SolanaLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M4 8L12 4L20 8L12 12L4 8Z"
        fill="url(#logo-gradient-1)"
      />
      <path
        d="M4 14L12 10L20 14L12 18L4 14Z"
        fill="url(#logo-gradient-2)"
      />
      <path
        d="M4 20L12 16L20 20L12 24L4 20Z"
        fill="url(#logo-gradient-3)"
      />
      <defs>
        <linearGradient id="logo-gradient-1" x1="4" y1="4" x2="20" y2="12">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="logo-gradient-2" x1="4" y1="10" x2="20" y2="18">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="logo-gradient-3" x1="4" y1="16" x2="20" y2="24">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg-primary/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <SolanaLogo />
          <span className="text-lg font-semibold tracking-tight">
            Key<span className="gradient-text">Sol</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/#brands"
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            Brands and Shopping
          </Link>
          <Link
            href="/rankings"
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            Rankings
          </Link>
          <Link
            href="/#about"
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            About
          </Link>
        </div>

        <Link
          href="/rankings"
          className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90"
        >
          View Rankings
        </Link>
      </nav>
    </header>
  );
}

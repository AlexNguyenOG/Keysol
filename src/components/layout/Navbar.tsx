import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "@/components/layout/MobileNav";
import { NAV_LINKS, SOLANA_KEYBOARD } from "@/components/layout/nav-links";

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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg-primary/80 backdrop-blur-md [view-transition-name:site-header]">
      <nav className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <SolanaLogo />
          <span className="text-lg font-semibold tracking-tight">
            Key<span className="gradient-text">Sol</span>
          </span>
        </Link>

        <div className="hidden min-w-0 w-full justify-self-stretch md:flex md:px-6 lg:px-10 xl:px-16">
          <div className="flex w-full items-center justify-between gap-4">
            {NAV_LINKS.map((link) => {
              const isSolanaKeyboards = link.href === "/solana-keyboards";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-1 text-sm text-text-muted transition-colors hover:text-text-primary lg:text-[0.9375rem]"
                >
                  {isSolanaKeyboards && (
                    <Image
                      src={SOLANA_KEYBOARD.image}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-sm object-cover"
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}

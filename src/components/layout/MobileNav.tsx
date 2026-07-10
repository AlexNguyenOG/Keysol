"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/components/layout/nav-links";

function isActiveLink(href: string, pathname: string): boolean {
  if (href.startsWith("/#")) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-white/20 hover:bg-white/5"
      >
        {open ? "Close" : "Menu"}
      </button>

      {open && (
        <div
          id="mobile-nav-menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-bg-surface p-2 shadow-xl"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActiveLink(link.href, pathname)
                  ? "bg-solana-purple/15 text-solana-purple"
                  : "text-text-muted hover:bg-white/5 hover:text-text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

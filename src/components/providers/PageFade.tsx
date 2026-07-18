"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTransitions(): boolean {
  return typeof document.startViewTransition === "function";
}

function getInternalNavHref(anchor: HTMLAnchorElement): string | null {
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:")) return null;

  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;

  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  ) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function pathFromHref(href: string): string {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href.split("?")[0]?.split("#")[0] ?? href;
  }
}

export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navigating = useRef(false);
  const resolveNavigation = useRef<(() => void) | null>(null);

  useEffect(() => {
    resolveNavigation.current?.();
    resolveNavigation.current = null;
    navigating.current = false;
  }, [pathname]);

  useEffect(() => {
    function navigate(href: string) {
      if (prefersReducedMotion() || !supportsViewTransitions()) {
        router.push(href);
        return;
      }

      navigating.current = true;

      document.startViewTransition(() => {
        router.push(href);

        return new Promise<void>((resolve) => {
          const targetPath = pathFromHref(href);

          if (window.location.pathname === targetPath) {
            resolve();
            return;
          }

          resolveNavigation.current = resolve;

          // Safety: never leave the transition hanging if the route stalls.
          window.setTimeout(() => {
            if (resolveNavigation.current === resolve) {
              resolveNavigation.current = null;
              resolve();
            }
          }, 1200);
        });
      });
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (navigating.current) {
        event.preventDefault();
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;

      const href = getInternalNavHref(anchor);
      if (!href) return;

      event.preventDefault();
      event.stopPropagation();
      navigate(href);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 flex-col">{children}</div>
  );
}

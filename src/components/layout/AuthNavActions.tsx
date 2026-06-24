"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export function AuthNavActions() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div
        className="h-9 w-24 animate-pulse rounded-lg bg-white/5"
        aria-hidden="true"
      />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[10rem] truncate text-sm text-text-muted sm:inline">
          {user.name}
        </span>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.refresh();
          }}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-white/20 hover:bg-white/5"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90"
      >
        Sign up
      </Link>
    </div>
  );
}

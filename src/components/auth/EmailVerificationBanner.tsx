"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export function EmailVerificationBanner() {
  const { user, refresh } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
      <span>Verify {user.email} to secure your account.</span>{" "}
      <button
        type="button"
        disabled={submitting}
        onClick={async () => {
          setSubmitting(true);
          setMessage(null);

          const response = await fetch("/api/auth/resend-verification", {
            method: "POST",
          });
          const data = (await response.json()) as { message?: string; error?: string };

          setSubmitting(false);
          setMessage(
            response.ok
              ? (data.message ?? "Verification email sent.")
              : (data.error ?? "Unable to resend verification email."),
          );
          await refresh();
        }}
        className="font-medium text-amber-50 underline underline-offset-2 hover:text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Resend email"}
      </button>
      {message ? <span className="mt-1 block text-xs text-amber-100/90">{message}</span> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GradientText } from "@/components/ui/GradientText";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(() =>
    token ? "" : "Verification token is missing.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          ok?: boolean;
          email?: string;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error ?? "Verification failed.");
          return;
        }

        setStatus("success");
        setMessage(data.email ?? "your email");
        router.refresh();
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setMessage("Verification failed.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="gradient-border rounded-2xl p-8 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-solana-green">
          Email verification
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {status === "success" ? (
            <>
              Email <GradientText as="span">verified</GradientText>
            </>
          ) : (
            <>
              Verifying <GradientText as="span">email</GradientText>
            </>
          )}
        </h1>

        {status === "loading" ? (
          <p className="mt-4 text-sm text-text-muted">Please wait…</p>
        ) : null}

        {status === "success" ? (
          <p className="mt-4 text-sm text-text-muted">
            {message} is now verified for your KeySol account.
          </p>
        ) : null}

        {status === "error" ? (
          <p className="mt-4 text-sm text-red-300">{message}</p>
        ) : null}

        <Link
          href="/"
          className="mt-6 inline-block font-medium text-solana-green hover:underline"
        >
          Back to KeySol
        </Link>
      </div>
    </div>
  );
}

export function VerifyEmailClient() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 w-full max-w-md" />}>
      <VerifyEmailInner />
    </Suspense>
  );
}

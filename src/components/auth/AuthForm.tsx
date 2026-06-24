"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { GradientText } from "@/components/ui/GradientText";
import { sanitizeCallbackUrl } from "@/lib/auth/redirect";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-solana-purple/50";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = isSignup
      ? await signup({ name, email, password })
      : await login({ email, password });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="gradient-border rounded-2xl p-8">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-solana-green">
            {isSignup ? "Join KeySol" : "Welcome back"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSignup ? (
              <>
                Create your <GradientText as="span">account</GradientText>
              </>
            ) : (
              <>
                Log in to <GradientText as="span">KeySol</GradientText>
              </>
            )}
          </h1>
          <p className="mt-3 text-sm text-text-muted">
            {isSignup
              ? "Save preferences and get ready for upcoming wallet features."
              : "Access your account across rankings, tokens, and more."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignup ? (
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClassName}
                placeholder="Alex"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="At least 8 characters with a letter and number"
            />
          </div>

          {!isSignup ? (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-solana-green hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2.5 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? isSignup
                ? "Creating account…"
                : "Logging in…"
              : isSignup
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link
                href={`/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="font-medium text-solana-green hover:underline"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              New to KeySol?{" "}
              <Link
                href={`/signup${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="font-medium text-solana-green hover:underline"
              >
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

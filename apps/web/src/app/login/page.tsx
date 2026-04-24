"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, API_BASE_URL, safeJson } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5A9.5 9.5 0 1 0 21.5 12c0-.6-.1-1.2-.2-1.8H12Z" />
      <path fill="#34A853" d="M6 14.4 5.4 17l-2.6 2A9.4 9.4 0 0 1 2.5 12c0-2.4.9-4.5 2.3-6.1l2.3 1.7 1 2.4A5.7 5.7 0 0 0 6.2 12c0 .8.1 1.6.4 2.4Z" />
      <path fill="#4A90E2" d="M12 21.5c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.5 0-4.7-1.7-5.4-4.1l-3.2 2.5A9.5 9.5 0 0 0 12 21.5Z" />
      <path fill="#FBBC05" d="M6.6 13.6A5.7 5.7 0 0 1 6.2 12c0-.8.1-1.6.4-2.4L3.4 7.1A9.5 9.5 0 0 0 2.5 12c0 1.7.4 3.3 1 4.7l3.1-2.4Z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login } = useAuth();
  const apiHealthUrl = `${API_BASE_URL}/api/health`;
  const normalizedError = error.toLowerCase();
  const showApiHelp =
    normalizedError.includes("authentication") ||
    normalizedError.includes("server") ||
    normalizedError.includes("service") ||
    normalizedError.includes("api");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextNotice = window.sessionStorage.getItem("authNotice");
    if (nextNotice) {
      setInfoMessage(nextNotice);
      window.sessionStorage.removeItem("authNotice");
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        setError(oauthError.message || "Google sign-in could not start. Try again.");
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError("Google sign-in is not configured yet. Add your Supabase keys and try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson<any>(res);

      if (res.ok && data?.token && data?.user) {
        await login(data.token, data.user);
      } else {
        setError(data?.error || "Sign-in failed. Check your email and password, then try again.");
      }
    } catch (err) {
      setError("Could not reach the sign-in service right now. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Welcome back."
      subtitle="Open your projects, return to lessons, and keep building from the same workspace."
      formTitle="Sign in"
      formSubtitle="Return to your studio"
      helperTitle="Workspace access"
      helperDescription="One sign-in keeps your circuit builds, code, and lessons together across the whole platform."
      helperChips={["Saved projects", "Courses", "Simulator"]}
      footer={
        <p>
          New here?{" "}
          <Link href="/register" className="font-semibold text-[color:var(--ui-color-primary)] transition-colors hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {infoMessage ? <StatusBanner tone="info" appearance="immersive">{infoMessage}</StatusBanner> : null}
        {error ? (
          <StatusBanner
            tone="error"
            appearance="immersive"
            title="We could not sign you in"
            action={
              showApiHelp ? (
                <a
                  href={apiHealthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/72 transition-colors hover:border-white/20 hover:text-white"
                >
                  View API health
                </a>
              ) : null
            }
          >
            {error}
          </StatusBanner>
        ) : null}

        <div className="space-y-3">
          <Button
            type="button"
            variant="inverse"
            icon={<GoogleIcon />}
            disabled={isGoogleLoading || isLoading}
            fullWidth
            className="min-h-[58px] rounded-[20px] border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]"
            onClick={() => void handleGoogleSignIn()}
          >
            {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--ui-border-soft)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ui-color-text-soft)]">
              Or continue with email
            </span>
            <div className="h-px flex-1 bg-[color:var(--ui-border-soft)]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ui-color-text-soft)]">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--ui-color-text-soft)]" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-[56px] w-full rounded-[20px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] pl-12 pr-4 text-sm text-[color:var(--ui-color-text)] outline-none transition-colors placeholder:text-[color:var(--ui-color-text-soft)] focus:border-[color:var(--ui-color-primary)]"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ui-color-text-soft)]">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--ui-color-text-soft)]" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[56px] w-full rounded-[20px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] pl-12 pr-4 text-sm text-[color:var(--ui-color-text)] outline-none transition-colors placeholder:text-[color:var(--ui-color-text-soft)] focus:border-[color:var(--ui-color-primary)]"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <Button
            type="submit"
            icon={<ArrowRight size={18} />}
            disabled={isLoading || isGoogleLoading}
            fullWidth
            className="min-h-[58px] rounded-[20px] bg-[linear-gradient(135deg,#5cb2ff,#7b61ff)] text-white hover:bg-[linear-gradient(135deg,#56a7f0,#7157f5)]"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthPageShell>
  );
}


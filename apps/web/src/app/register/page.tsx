"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, API_BASE_URL, safeJson } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const apiHealthUrl = `${API_BASE_URL}/api/health`;
  const normalizedError = error.toLowerCase();
  const showApiHelp =
    normalizedError.includes("authentication") ||
    normalizedError.includes("server") ||
    normalizedError.includes("service") ||
    normalizedError.includes("api");

  const passwordMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [confirmPassword, password]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (passwordMismatch) {
      setError("Your passwords do not match yet. Check both fields, then try again.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await safeJson<any>(res);

      if (res.ok && data?.token && data?.user) {
        login(data.token, data.user);
      } else {
        setError(data?.error || "Registration failed. Review your details and try again.");
      }
    } catch (err) {
      setError("Could not reach the account service right now. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Create your workspace."
      subtitle="Start with one account for guided lessons, saved builds, and the full simulator flow."
      formTitle="Create account"
      formSubtitle="Start building today"
      helperTitle="Quick start"
      helperDescription="Create your account, pick a board, and open the right workspace for blocks, text, or simulation."
      helperChips={["Choose a mode", "Pick a board", "Start building"]}
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white transition-colors hover:text-sky-300">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {error ? (
          <StatusBanner
            tone="error"
            appearance="immersive"
            title="We could not create your account"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Full name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/34" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-[56px] w-full rounded-[20px] border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/26 focus:border-sky-300/36 focus:bg-white/[0.06]"
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/34" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-[56px] w-full rounded-[20px] border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/26 focus:border-sky-300/36 focus:bg-white/[0.06]"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/34" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[56px] w-full rounded-[20px] border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/26 focus:border-sky-300/36 focus:bg-white/[0.06]"
                placeholder="Create a password"
              />
            </div>
            <p className="text-xs leading-5 text-white/42">Use at least 8 characters.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/34" size={18} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={`h-[56px] w-full rounded-[20px] border bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/26 ${
                  passwordMismatch
                    ? "border-rose-300/28 focus:border-rose-300/46"
                    : "border-white/10 focus:border-sky-300/36 focus:bg-white/[0.06]"
                }`}
                placeholder="Repeat your password"
              />
            </div>
            {passwordMismatch ? <p className="text-xs leading-5 text-rose-200">These passwords do not match yet.</p> : null}
          </div>

          <Button
            type="submit"
            icon={<ArrowRight size={18} />}
            disabled={isLoading || passwordMismatch}
            fullWidth
            className="min-h-[58px] rounded-[20px] bg-[linear-gradient(135deg,#5cb2ff,#7b61ff)] text-white hover:bg-[linear-gradient(135deg,#56a7f0,#7157f5)]"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>
    </AuthPageShell>
  );
}

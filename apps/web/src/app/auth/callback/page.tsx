"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, safeJson } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function waitForSupabaseSession() {
  const supabase = getSupabaseBrowserClient();
  const current = await supabase.auth.getSession();

  if (current.error) {
    throw current.error;
  }

  if (current.data.session?.access_token) {
    return current.data.session;
  }

  return await new Promise<any>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 4000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        window.clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve(session);
      }
    });
  });
}

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const finishGoogleSignIn = async () => {
      try {
        const returnedError = searchParams.get("error_description");
        if (returnedError) {
          throw new Error(returnedError);
        }

        const session = await waitForSupabaseSession();
        const accessToken = session?.access_token ?? null;

        if (!accessToken) {
          throw new Error("Google sign-in did not return a session. Please try again.");
        }

        const response = await apiFetch("/api/auth/supabase/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
        const data = await safeJson<any>(response);

        if (!response.ok || !data?.token || !data?.user) {
          throw new Error(data?.error || "We could not finish Google sign-in.");
        }

        if (!cancelled) {
          login(data.token, data.user, { redirectTo: "/dashboard" });
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Google sign-in failed. Please try again from the login page.";

        try {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
        } catch {}

        if (!cancelled) {
          setError(message);
        }
      }
    };

    void finishGoogleSignIn();

    return () => {
      cancelled = true;
    };
  }, [login, searchParams]);

  return (
    <AuthPageShell
      title="Finishing your sign-in."
      subtitle="We are connecting your Google account to the existing workspace session so your projects and dashboard open normally."
      formTitle="Google sign-in"
      formSubtitle="Complete authentication"
      helperTitle="Secure handoff"
      helperDescription="Supabase confirms the Google login, then the existing API creates the same app session used by your dashboard and project routes."
      helperChips={["Google OAuth", "Supabase session", "Workspace access"]}
      footer={
        <p>
          Need a different route?{" "}
          <Link href="/login" className="font-semibold text-[color:var(--ui-color-primary)] transition-colors hover:underline">
            Return to sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {error ? (
          <>
            <StatusBanner tone="error" appearance="immersive" title="Google sign-in could not be completed">
              {error}
            </StatusBanner>
            <Link href="/login" className="block">
              <Button fullWidth icon={<ArrowRight size={18} />}>
                Back to login
              </Button>
            </Link>
          </>
        ) : (
          <div className="rounded-[24px] border border-[color:var(--ui-border-soft)] bg-[color:var(--ui-color-surface)] px-5 py-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-full bg-[color:var(--ui-color-primary)]/12 p-3 text-[color:var(--ui-color-primary)]">
                <LoaderCircle size={20} className="animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--ui-color-text)]">
                  Completing Google login
                </h3>
                <p className="text-sm leading-7 text-[color:var(--ui-color-text-muted)]">
                  Hold tight for a moment while we exchange your Google session for your existing app login and redirect you to the dashboard.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthPageShell>
  );
}

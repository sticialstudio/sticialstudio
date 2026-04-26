"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/api';
import { isClientDevAuthBypassEnabled } from '@/lib/auth/devBypass';
import { normalizeRuntimeError } from '@/lib/runtime/normalizeRuntimeError';

export interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User, options?: { redirectTo?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEV_BYPASS_USER: User = {
  id: 'dev-user-id',
  email: 'stemaide-dev@example.com',
  name: 'Developer',
};

function persistToken(token: string) {
  localStorage.setItem('token', token);
}

function clearPersistedAuth() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('activeProjectId');
  } catch {}
}

async function syncSessionCookie(token: string) {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const payload = await safeJson<{ error?: string }>(response);
    throw new Error(payload?.error || 'Could not establish the protected app session.');
  }
}

async function clearSessionCookie() {
  await fetch('/api/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => undefined);
}

function stashAuthNotice(message: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem('authNotice', message);
}

async function startDevBypassSession() {
  const response = await apiFetch('/api/auth/dev-login', { method: 'POST' });
  const data = await safeJson<{ token?: string; user?: User; error?: string }>(response);

  if (!response.ok || !data?.token || !data?.user) {
    throw new Error(data?.error || 'Development login is not available.');
  }

  await syncSessionCookie(data.token);
  persistToken(data.token);

  return {
    token: data.token,
    user: data.user,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasInitializedAuth = useRef(false);

  const publicRoutes = ['/', '/login', '/register', '/auth/callback'];

  const clearAuthState = useCallback(async () => {
    clearPersistedAuth();
    setToken(null);
    setUser(null);
    await clearSessionCookie();
  }, []);

  useEffect(() => {
    if (hasInitializedAuth.current) {
      return;
    }

    hasInitializedAuth.current = true;

    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3500);

    const initAuth = async () => {
      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem('token');
      } catch {
        console.warn('Local storage access denied or unavailable.');
      }

      if (!storedToken) {
        await clearSessionCookie();

        if (isClientDevAuthBypassEnabled()) {
          try {
            const devSession = await startDevBypassSession();
            if (!isCancelled) {
              setUser(devSession.user);
              setToken(devSession.token);
            }
          } catch (error) {
            console.warn('Development auth bypass could not get an API token.', normalizeRuntimeError(error));
            if (!isCancelled) {
              setUser(DEV_BYPASS_USER);
              setToken(null);
            }
          }

          if (!isCancelled) {
            setIsLoading(false);
          }
          return;
        }

        if (!isCancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await apiFetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
          signal: controller.signal,
        });

        if (isCancelled) {
          return;
        }

        if (res.ok) {
          const data = await safeJson<{ user: User }>(res);
          if (data?.user) {
            await syncSessionCookie(storedToken);
            if (isCancelled) {
              return;
            }
            persistToken(storedToken);
            setUser(data.user);
            setToken(storedToken);
          } else {
            stashAuthNotice('Your session ended. Sign in again to keep working.');
            await clearAuthState();
          }
        } else {
          stashAuthNotice(
            res.status === 401 || res.status === 403
              ? 'Your session ended. Sign in again to keep working.'
              : 'We could not reconnect to your session. Sign in again to continue.'
          );
          await clearAuthState();
        }
      } catch (error) {
        if (isCancelled || controller.signal.aborted) {
          return;
        }

        console.error('Failed to verify token', normalizeRuntimeError(error, 'Failed to verify token.'));
        stashAuthNotice('We could not reconnect to your session. Sign in again to continue.');
        await clearAuthState();
      } finally {
        window.clearTimeout(timeoutId);
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      void initAuth();
    }

    return () => {
      isCancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [clearAuthState]);

  useEffect(() => {
    if (!isLoading) {
      if (!user && !publicRoutes.includes(pathname)) {
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, user, pathname, router]);

  const login = useCallback(
    async (newToken: string, userData: User, options?: { redirectTo?: string }) => {
      persistToken(newToken);
      try {
        await syncSessionCookie(newToken);
        setToken(newToken);
        setUser(userData);
        router.push(options?.redirectTo ?? '/dashboard');
      } catch (error) {
        clearPersistedAuth();
        setToken(null);
        setUser(null);
        const normalized = normalizeRuntimeError(error, 'Could not complete sign-in.');
        stashAuthNotice(normalized.message);
        throw new Error(normalized.message);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    await clearAuthState();
    router.push('/login');
  }, [clearAuthState, router]);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    login,
    logout,
  };

  if (isLoading) {
    return (
      <div className="ui-foundation-shell flex min-h-screen items-center justify-center px-6 py-8">
        <div className="ui-foundation-panel w-full max-w-md px-8 py-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--ui-color-primary)]/55 border-t-transparent" />
          <h2 className="mt-4 text-xl font-bold tracking-[-0.03em] text-[var(--ui-color-text)]">Restoring your workspace</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ui-color-text-muted)]">
            Checking your session so Sticial Studio can reopen the right project and learning flow.
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

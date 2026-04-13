"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/api';

export interface User {
    id: string;
    email: string;
    name: string | null;
}

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User, options?: { redirectTo?: string }) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistToken(token: string) {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; SameSite=Lax`;
}

function clearPersistedAuth() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('activeProjectId');
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    } catch {}
}

function stashAuthNotice(message: string) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem('authNotice', message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/', '/login', '/register', '/auth/callback'];

    const clearAuthState = useCallback(() => {
        clearPersistedAuth();
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            let storedToken: string | null = null;
            try {
                storedToken = localStorage.getItem('token');
            } catch (e) {
                console.warn('Local storage access denied or unavailable.');
            }

            if (!storedToken) {
                try { clearAuthState(); } catch (e) {}
                setIsLoading(false);
                return;
            }

            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 3500);

            try {
                const res = await apiFetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    signal: controller.signal
                });
                if (res.ok) {
                    const data = await safeJson<{ user: User }>(res);
                    if (data?.user) {
                        persistToken(storedToken);
                        setUser(data.user);
                        setToken(storedToken);
                    } else {
                        stashAuthNotice('Your session ended. Sign in again to keep working.');
                        clearAuthState();
                    }
                } else {
                    stashAuthNotice(
                        res.status === 401 || res.status === 403
                            ? 'Your session ended. Sign in again to keep working.'
                            : 'We could not reconnect to your session. Sign in again to continue.'
                    );
                    clearAuthState();
                }
            } catch (e) {
                console.error('Failed to verify token', e);
                stashAuthNotice('We could not reconnect to your session. Sign in again to continue.');
                clearAuthState();
            } finally {
                window.clearTimeout(timeoutId);
                setIsLoading(false);
            }
        };

        if (typeof window !== 'undefined') {
            initAuth();
        }
    }, [clearAuthState, pathname]);

    useEffect(() => {
        if (!isLoading) {
            if (!user && !publicRoutes.includes(pathname)) {
                router.push('/login');
            } else if (user && (pathname === '/login' || pathname === '/register')) {
                router.push('/dashboard');
            }
        }
    }, [isLoading, user, pathname, router]);

    const login = (newToken: string, userData: User, options?: { redirectTo?: string }) => {
        persistToken(newToken);
        setToken(newToken);
        setUser(userData);
        router.push(options?.redirectTo ?? '/dashboard');
    };

    const logout = () => {
        clearAuthState();
        router.push('/login');
    };

    const value: AuthContextValue = {
        user,
        token,
        isLoading,
        login,
        logout
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

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

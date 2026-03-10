"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/', '/login', '/register'];

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
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
                        setUser(data.user);
                        setToken(storedToken);
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('activeProjectId');
                        setToken(null);
                        setUser(null);
                    }
                } else {
                    // Token invalid/expired
                    localStorage.removeItem('token');
                    localStorage.removeItem('activeProjectId');
                    setToken(null);
                    setUser(null);
                }
            } catch (e) {
                console.error('Failed to verify token', e);
                // Avoid blocking UI if auth server is unreachable
                localStorage.removeItem('token');
                localStorage.removeItem('activeProjectId');
                setToken(null);
                setUser(null);
            } finally {
                window.clearTimeout(timeoutId);
                setIsLoading(false);
            }
        };

        // Don't verify on server
        if (typeof window !== 'undefined') {
            initAuth();
        }
    }, [pathname]);

    // Route Protection
    useEffect(() => {
        if (!isLoading) {
            if (!user && !publicRoutes.includes(pathname)) {
                router.push('/login');
            } else if (user && (pathname === '/login' || pathname === '/register')) {
                router.push('/'); // Or wherever a logged-in user should go by default
            }
        }
    }, [isLoading, user, pathname, router]);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeProjectId');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    const value: AuthContextValue = {
        user,
        token,
        isLoading,
        login,
        logout
    };

    // Render loading state while calculating auth to prevent flash of content
    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0f111a]">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
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





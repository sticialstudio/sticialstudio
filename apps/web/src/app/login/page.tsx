"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, API_BASE_URL, safeJson } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const apiHealthUrl = API_BASE_URL + '/api/health';
    const showApiHelp = error.toLowerCase().includes('authentication server') || error.toLowerCase().includes('api');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await apiFetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await safeJson<any>(res);

            if (res.ok && data?.token && data?.user) {
                login(data.token, data.user);
            } else {
                setError(data?.error || 'Login failed');
            }
        } catch (err) {
            setError(`Could not connect to the authentication server at ${API_BASE_URL}.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/20 blur-[100px] rounded-full -z-10 animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full -z-10 animate-pulse delay-700"></div>

            <div className="w-full max-w-md p-8 bg-panel border border-panel-border rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400 text-sm">Sign in to EdTech OS to continue</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center">
                        {error}
                        {showApiHelp && (
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-rose-300">
                                <span>Check API:</span>
                                <a
                                    href={apiHealthUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border border-rose-400/40 px-2 py-0.5 text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
                                >
                                    Open /api/health
                                </a>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-panel-border rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                                placeholder="you@edtech.local"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-panel-border rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                                placeholder="********"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm py-1">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input type="checkbox" className="rounded border-panel-border bg-slate-900 text-accent focus:ring-accent/50 cursor-pointer" />
                            <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                        </label>
                        <a href="#" className="text-accent hover:text-indigo-300 transition-colors font-medium">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center space-x-2 group mt-2 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                        {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>
                <div className="mt-6 text-center text-xs text-slate-500">
                    API endpoint: <span className="font-mono text-slate-400">{API_BASE_URL}</span>
                </div>

                <div className="mt-8 text-center text-sm text-slate-400">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-accent hover:text-indigo-300 font-semibold transition-colors">
                        Create one now
                    </Link>
                </div>
            </div>
        </div>
    );
}




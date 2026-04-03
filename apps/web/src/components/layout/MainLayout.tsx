"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useBoard } from '@/contexts/BoardContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ThemeToggle from './ThemeToggle';

function matchesRoute(pathname: string, routes: string[]) {
    return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isFullScreen, setIsFullScreen } = useBoard();

    const immersiveShellRoutes = ['/', '/projects/select-mode', '/projects/select-language', '/projects/select-board', '/projects/select-environment'];
    const workspaceOwnedShellRoutes = [...immersiveShellRoutes, '/projects/ide'];
    const shouldHideNavbar = matchesRoute(pathname, workspaceOwnedShellRoutes) || isFullScreen;
    const shouldHideSidebar = matchesRoute(pathname, [...workspaceOwnedShellRoutes, '/dashboard']) || isFullScreen;
    const managesOwnShellChrome = matchesRoute(pathname, workspaceOwnedShellRoutes);

    return (
        <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors">
            {!shouldHideSidebar && <Sidebar />}
            <div className="relative flex h-full flex-1 flex-col overflow-hidden">
                {!shouldHideNavbar && <Navbar />}

                {shouldHideNavbar && pathname !== '/' && !managesOwnShellChrome ? (
                    <div className="absolute right-4 top-4 z-[120]">
                        <ThemeToggle showLabel />
                    </div>
                ) : null}

                {isFullScreen && (
                    <button
                        onClick={() => setIsFullScreen(false)}
                        className="absolute left-1/2 top-0 z-[100] flex -translate-x-1/2 items-center rounded-b-lg border border-t-0 border-panel-border bg-panel px-4 py-1.5 text-xs font-semibold tracking-wide text-muted opacity-25 transition-all hover:text-foreground hover:opacity-100"
                        title="Exit Focus Mode"
                    >
                        <ChevronDown size={14} className="mr-1.5" />
                        Show Navbar
                    </button>
                )}

                <main className="relative z-0 flex flex-1 flex-col overflow-hidden">{children}</main>
            </div>
        </div>
    );
}

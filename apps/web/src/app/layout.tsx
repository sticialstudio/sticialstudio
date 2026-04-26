import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';
import { BoardProvider } from '@/contexts/BoardContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StudioPreferencesProvider } from '@/contexts/StudioPreferencesContext';
import { CircuitProvider } from '@/contexts/CircuitContext';

const editorMono = localFont({
  src: './fonts/GeistMonoLatin.woff2',
  variable: '--font-editor-mono',
  display: 'swap',
  fallback: ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
});

export const metadata: Metadata = {
  title: 'Sticial Studio',
  description: 'Educational block and text coding platform for hardware projects',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${editorMono.variable} antialiased`}>
        <ThemeProvider>
          <StudioPreferencesProvider>
            <AuthProvider>
              <BoardProvider>
                <ProjectProvider>
                  <CircuitProvider>{children}</CircuitProvider>
                </ProjectProvider>
              </BoardProvider>
            </AuthProvider>
          </StudioPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

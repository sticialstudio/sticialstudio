import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import './globals.css';
import { BoardProvider } from '@/contexts/BoardContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StudioPreferencesProvider } from '@/contexts/StudioPreferencesContext';
import { CircuitProvider } from '@/contexts/CircuitContext';

const monoFontStyle = {
  '--font-jetbrains-mono': "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
} as CSSProperties;

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
      <body className="antialiased" style={monoFontStyle}>
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

import type { Metadata } from 'next';
import './globals.css';
import { BoardProvider } from '@/contexts/BoardContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StudioPreferencesProvider } from '@/contexts/StudioPreferencesContext';
import { CircuitProvider } from '@/contexts/CircuitContext';

export const metadata: Metadata = {
  title: 'EdTech IDE',
  description: 'Educational block and text coding platform'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="antialiased">
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


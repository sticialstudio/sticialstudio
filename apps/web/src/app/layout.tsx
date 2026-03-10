import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { BoardProvider } from '@/contexts/BoardContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap'
});

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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <BoardProvider>
              <ProjectProvider>{children}</ProjectProvider>
            </BoardProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

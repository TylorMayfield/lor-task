import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LOR Task - Intelligent Task Management',
  description: 'AI-powered task management with NLP, smart scheduling, and pattern learning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


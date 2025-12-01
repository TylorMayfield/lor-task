import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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
      <body className="dark-theme">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


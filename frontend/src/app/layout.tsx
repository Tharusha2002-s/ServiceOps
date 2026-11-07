import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'ServiceOps — Enterprise ITSM Platform',
  description: 'Production-ready IT Service Management & Operations Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,520;9..144,620&family=IBM+Plex+Mono:wght@450;500&family=Outfit:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

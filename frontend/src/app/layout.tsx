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
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}


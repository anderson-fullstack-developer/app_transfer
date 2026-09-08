import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'app-transfer',
  description: 'Envia apoio financeiro para estudantes de forma simples, rastreavel e segura.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="pt">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seed - Autorizações Esportivas',
  description: 'Gestão Inteligente de Termos e Autorizações',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
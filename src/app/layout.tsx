import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seed Esportes - Termo de Autorização',
  description: 'Termo de Autorização para Atividade Física e Cessão de Direitos de Imagem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
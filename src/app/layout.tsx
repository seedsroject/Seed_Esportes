import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'Seed - Autorizações Esportivas',
  description: 'Gestão Inteligente de Termos e Autorizações',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Seed Termos',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
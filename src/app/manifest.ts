import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Seed Termos',
    short_name: 'Seed Termos',
    description: 'Gestão Inteligente de Termos e Autorizações Esportivas',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}

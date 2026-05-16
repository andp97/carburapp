import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CarburApp',
    short_name: 'CarburApp',
    description: 'Traccia rifornimenti, manutenzione e scadenze della tua auto.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0F17',
    theme_color: '#FF7A3D',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['utilities', 'finance', 'auto'],
  };
}

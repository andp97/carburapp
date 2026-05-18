import type { Metadata, Viewport } from 'next';
import { Manrope, JetBrains_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://carburapp.vercel.app';
const DESCRIPTION = 'Traccia rifornimenti, manutenzione e scadenze della tua auto.';

export const metadata: Metadata = {
  title: {
    default: 'CarburApp',
    template: '%s | CarburApp',
  },
  description: DESCRIPTION,
  keywords: ['auto', 'rifornimento', 'carburante', 'manutenzione', 'scadenze', 'veicolo', 'spese auto'],
  authors: [{ name: 'CarburApp' }],
  metadataBase: new URL(APP_URL),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CarburApp',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: APP_URL,
    siteName: 'CarburApp',
    title: 'CarburApp',
    description: DESCRIPTION,
    // opengraph-image.tsx is auto-detected by Next.js and takes priority
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarburApp',
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF7A3D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${manrope.variable} ${jetBrainsMono.variable}`}>
      <body>
        <div className="app-root">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </div>
        <SpeedInsights />
        <script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
      // When a new SW takes control, reload to get fresh assets
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
      });
    });
  }
` }} />
      </body>
    </html>
  );
}

import { DEFAULT_LOCALE, vi } from '@/lib/i18n';
import { feminineColors } from '@/lib/theme';
import type { Metadata, Viewport } from 'next';
import { Quicksand } from 'next/font/google';
import type { ReactNode } from 'react';
import { PwaInstallBanner } from '@/components/pwa';
import { THEME_ANTI_FLASH_SCRIPT } from '@/lib/theme';
import { Providers } from './providers';
import './globals.css';

// Quicksand → biến CSS `--font-quicksand` mà `--font-sans` của tokens tham chiếu.
const quicksand = Quicksand({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

const MATERIAL_SYMBOLS_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400..700,0..1,0&display=block';

export const metadata: Metadata = {
  title: 'CuteTeachy – Serene Educator',
  description: vi.common.tagline,
  applicationName: 'CuteTeachy',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CuteTeachy',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: feminineColors.background,
};

export interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={DEFAULT_LOCALE} className={quicksand.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Icon font: `display=block` để không lộ chữ ligature trước khi font tải xong. */}
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Chống nháy màu (flash of unstyled theme) khi reload trang */}
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_ANTI_FLASH_SCRIPT,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <PwaInstallBanner />
        </Providers>
      </body>
    </html>
  );
}

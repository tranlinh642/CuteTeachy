import { DEFAULT_LOCALE } from '@cute-teachy/i18n';
import type { Metadata, Viewport } from 'next';
import { Quicksand } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/lib/providers';
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
  title: 'CuteTeachy',
  applicationName: 'CuteTeachy',
};

export const viewport: Viewport = {
  themeColor: '#fff8f7',
};

export interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={DEFAULT_LOCALE} className={quicksand.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Icon font: `display=block` để không lộ chữ ligature trước khi font tải xong. */}
        {/* eslint-disable-next-line @next/next/google-font-display */}
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'تعلّم | منصة تعليمية',
  description: 'منصة تعليمية متكاملة توفر آلاف الكورسات من أفضل الخبراء',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-navy text-slate-50 font-cairo antialiased">{children}</body>
    </html>
  );
}

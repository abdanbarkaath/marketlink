import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';
import AppHeader from '@/components/AppHeader';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}

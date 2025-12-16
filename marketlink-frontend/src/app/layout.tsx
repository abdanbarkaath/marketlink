import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            {/* Brand */}
            <Link href="/" className="text-lg font-semibold">
              MarketLink
            </Link>

            {/* Nav actions */}
            <nav className="flex items-center gap-3">
              <Link href="/login" className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50">
                Login
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}

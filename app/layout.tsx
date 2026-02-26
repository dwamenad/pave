import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Providers } from "@/components/providers";
import { AuthControls } from "@/components/auth-controls";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Click Away",
  description: "Turn social place ideas into ready-to-use trip plans"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-8">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <Link href="/" className="text-sm font-semibold">One Click Away</Link>
                <Link href="/feed" className="text-xs text-muted-foreground hover:underline">Feed</Link>
                <Link href="/nearby" className="text-xs text-muted-foreground hover:underline">Nearby</Link>
              </div>
              <AuthControls />
            </header>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

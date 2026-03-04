import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Search } from "lucide-react";
import { Providers } from "@/components/providers";
import { AuthControls } from "@/components/auth-controls";
import { PaveMark } from "@/components/pave-mark";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: {
    default: "Pave",
    template: "%s | Pave"
  },
  description: "Turn social place ideas into ready-to-use trip plans with Pave",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className={jakarta.variable}>
        <Providers>
          <div className="relative min-h-screen">
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-background/90 backdrop-blur-md">
              <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <PaveMark className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-extrabold tracking-tight">Pave</span>
                  </Link>
                  <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
                    <Link href="/feed" className="hover:text-foreground">Explore</Link>
                    <Link href="/create" className="hover:text-foreground">Create</Link>
                    <Link href="/nearby" className="hover:text-foreground">Nearby</Link>
                  </nav>
                </div>

                <div className="hidden w-72 items-center rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground lg:flex">
                  <Search className="mr-2 h-4 w-4" />
                  <input
                    aria-label="Search itineraries"
                    className="w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search itineraries..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <AuthControls />
                </div>
              </div>
            </header>
            <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

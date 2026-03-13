"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";
import { PaveMark } from "@/components/pave-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <main>{children}</main>;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <PaveMark className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">Pave</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
              <Link href="/feed" className="hover:text-foreground">
                Explore
              </Link>
              <Link href="/create" className="hover:text-foreground">
                Create
              </Link>
              <Link href="/nearby" className="hover:text-foreground">
                Nearby
              </Link>
              <Link href="/support" className="hover:text-foreground">
                Support
              </Link>
            </nav>
          </div>

          <div className="hidden w-72 items-center rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm lg:flex">
            <Search className="mr-2 h-4 w-4" />
            <input
              aria-label="Search itineraries"
              className="w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search itineraries..."
            />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthControls />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-border bg-background/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            Pave keeps planning, publishing, moderation, and mobile continuity in one product loop. Some surfaces still
            degrade gracefully when optional providers are unavailable.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/support" className="hover:text-foreground">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

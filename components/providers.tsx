"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { WebRuntimeObserver } from "@/components/web-runtime-observer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <WebRuntimeObserver />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}

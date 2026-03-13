import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteFrame } from "@/components/site-frame";
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
    <html lang="en" suppressHydrationWarning>
      <body className={jakarta.variable}>
        <Providers>
          <div className="relative min-h-screen">
            <SiteFrame>{children}</SiteFrame>
          </div>
        </Providers>
      </body>
    </html>
  );
}

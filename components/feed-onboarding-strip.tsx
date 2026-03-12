"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const FEED_ONBOARDING_SEEN_KEY = "pave.feed.onboarding.seen";

export function FeedOnboardingStrip() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const seen = window.localStorage.getItem(FEED_ONBOARDING_SEEN_KEY);
      if (!seen) {
        window.localStorage.setItem(FEED_ONBOARDING_SEEN_KEY, "1");
        setVisible(true);
      }
    } catch {
      // Ignore storage errors and keep banner hidden.
    }
  }, []);

  if (!mounted || !visible) return null;

  return (
    <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-cyan-200/70 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 p-4 text-slate-800 shadow-sm dark:border-cyan-400/20 dark:from-cyan-950/35 dark:via-sky-950/25 dark:to-blue-950/30 dark:text-slate-100 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex rounded-full bg-primary/15 p-2 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold">New here? Start by exploring, then build your own itinerary.</p>
          <p className="text-xs text-muted-foreground">Remix anything you like, or jump straight into create mode.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/create"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          Create your first itinerary
        </Link>
        <button
          type="button"
          aria-label="Dismiss onboarding"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

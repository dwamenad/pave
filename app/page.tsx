import Link from "next/link";
import { Compass, Sparkles, TrendingUp } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

const sampleInspiration = [
  {
    title: "Tokyo Neon Nights",
    subtitle: "Inspired by social clips from Shibuya and Shinjuku",
    days: "3 days"
  },
  {
    title: "Lisbon Food + Coast",
    subtitle: "Curated from local chef reels and city walking guides",
    days: "4 days"
  },
  {
    title: "Swiss Alps Trek",
    subtitle: "Built from mountain route threads and creator posts",
    days: "7 days"
  }
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="social-hero-panel overflow-hidden p-7 md:p-9">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 space-y-6">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Explore-first itinerary builder
            </div>
            <div>
              <h1 className="social-hero-title">Turn social inspiration into an actionable trip plan</h1>
              <p className="social-hero-subtitle">
                Start on Explore, parse links from Reels, TikTok, YouTube, and X, then generate a customizable itinerary you can publish to Pave.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/feed"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <Compass className="h-4 w-4" />
                Enter social feed
              </Link>
              <Link
                href="/create"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
              >
                Start with create page
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-200 p-5 shadow-sm dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-blue-950/30">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Inspiration snapshots
            </p>
            <div className="mt-4 space-y-3">
              {sampleInspiration.map((card) => (
                <article key={card.title} className="rounded-xl border border-white/70 bg-card/90 p-3 backdrop-blur dark:border-border">
                  <p className="text-sm font-bold text-foreground">{card.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                  <p className="mt-2 inline-flex rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-foreground">{card.days}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingForm />
    </div>
  );
}

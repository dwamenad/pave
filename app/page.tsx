import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  MapPinned,
  MessageSquareText,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles
} from "lucide-react";
import { LandingForm } from "@/components/landing-form";
import createScreenshot from "@/docs/assets/screenshots/pave-smoke-create.png";
import feedScreenshot from "@/docs/assets/screenshots/pave-smoke-feed.png";
import nearbyScreenshot from "@/docs/assets/screenshots/pave-smoke-nearby.png";
import tripBuilderScreenshot from "@/docs/assets/screenshots/pave-smoke-trip-builder.png";

const heroPoints = [
  "Parse links, captions, and notes into a trip draft you can actually edit.",
  "Explore a live social feed, then reuse the best trips instead of starting from scratch.",
  "Carry the same planning identity across the web app and the mobile beta."
];

const proofChips = [
  "Live web product",
  "Mobile beta",
  "AI-assisted create flow",
  "Publish + remix",
  "Trip exports",
  "Legal + trust pages"
];

const productLoop = [
  {
    icon: Sparkles,
    title: "Bring the inspiration",
    body: "Start from the links, posts, captions, and loose notes that already shaped the trip."
  },
  {
    icon: MapPinned,
    title: "Resolve the destination",
    body: "Pave detects the location signal, surfaces place context, and keeps the trip anchored in real places."
  },
  {
    icon: Route,
    title: "Shape the plan",
    body: "Use the create flow and trip builder to review, refine, and export something people can actually use."
  },
  {
    icon: MessageSquareText,
    title: "Publish and reuse",
    body: "Share the itinerary into the feed, save it, remix it, and carry it forward into the next trip."
  }
];

const surfaces = [
  {
    title: "Create from inspiration",
    description: "The workflow that turns social travel chaos into a structured trip draft with review before save.",
    screenshot: createScreenshot,
    href: "/create",
    meta: "Links, captions, hints"
  },
  {
    title: "Explore the feed",
    description: "Browse public itineraries, save the good ones, and find the trips worth remixing.",
    screenshot: feedScreenshot,
    href: "/feed",
    meta: "Publish, save, follow"
  },
  {
    title: "Plan day by day",
    description: "Open the trip builder to work through timing, places, movement, and final export.",
    screenshot: tripBuilderScreenshot,
    href: "/trip/lisbon-food-club",
    meta: "Builder, exports, notes"
  },
  {
    title: "Discover nearby",
    description: "Find place context around the trip and keep exploration attached to the itinerary itself.",
    screenshot: nearbyScreenshot,
    href: "/nearby",
    meta: "Nearby, place context"
  }
];

const trustNotes = [
  {
    icon: ShieldCheck,
    title: "Built honestly",
    body: "Pave already ships planning, publishing, moderation entry points, exports, and a mobile beta. We keep the current constraints explicit."
  },
  {
    icon: Smartphone,
    title: "One product loop",
    body: "The public site, app routes, support pages, and mobile surfaces stay in one repo so the story and the product do not drift apart."
  },
  {
    icon: Compass,
    title: "Explore first",
    body: "The homepage now behaves like the front door to pavetrip.com: explore, create, then move deeper into the app when the intent is real."
  }
];

export default function HomePage() {
  return (
    <div className="space-y-14 md:space-y-16">
      <section className="social-hero-panel overflow-hidden px-6 py-5 md:px-8 md:py-6">
        <div className="grid gap-7 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Public site direction: pavetrip.com
              </span>
              <span className="pill-chip">Built in one repo</span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground md:text-[3.45rem] md:leading-[1.02] xl:text-[4.3rem]">
                Plan the trip your saved posts started.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-[1.05rem] md:leading-8">
                Pave turns travel inspiration from links, captions, and notes into structured itineraries you can review,
                publish, remix, and reuse. This homepage is the public front door for the product, while the planning,
                social, and export workflows stay right behind it.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90"
              >
                Explore live itineraries
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/create"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
              >
                Turn inspiration into a plan
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {heroPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  {point}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {proofChips.map((chip) => (
                <span key={chip} className="pill-chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
            <div className="relative rounded-[28px] border border-border bg-card/92 p-4 shadow-[0_28px_80px_-32px_rgba(14,165,233,0.45)] backdrop-blur">
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Create flow</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">Start with the source material</p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">Review before save</span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted/60">
                    <Image
                      src={createScreenshot}
                      alt="Pave create flow showing social inspiration being turned into a structured trip draft."
                      className="h-auto w-full object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-border bg-muted/55 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Explore first</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Feed, nearby discovery, and public trip pages stay visible before sign-in so the product earns the next step.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="overflow-hidden rounded-2xl border border-border bg-muted/60">
                      <Image
                        src={feedScreenshot}
                        alt="Pave feed with public itinerary cards."
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-border bg-muted/60">
                      <Image
                        src={tripBuilderScreenshot}
                        alt="Pave trip builder with day-by-day itinerary planning."
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-background/70 p-4 md:grid-cols-3">
                <div className="social-kpi">
                  <span className="social-kpi-value">Web</span>
                  Planning, publishing, exports
                </div>
                <div className="social-kpi">
                  <span className="social-kpi-value">Mobile beta</span>
                  Auth, feed, create, trip access
                </div>
                <div className="social-kpi">
                  <span className="social-kpi-value">Honest constraints</span>
                  No media uploads, no realtime yet
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">How the site works now</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">One public front door. One product loop.</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            We’re keeping the public site and the product in the same repo so the narrative stays close to the real
            workflow: explore, create, review, publish, and reuse.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {productLoop.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="social-card p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">What visitors can open right now</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">Real product surfaces, not concept panels.</h2>
          </div>
          <Link href="/feed" className="theme-inline-button w-fit">
            Open the public feed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {surfaces.map((surface) => (
            <article key={surface.title} className="social-card overflow-hidden">
              <div className="border-b border-border bg-muted/45 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-foreground">{surface.title}</p>
                    <p className="mt-1 max-w-xl text-sm leading-7 text-muted-foreground">{surface.description}</p>
                  </div>
                  <span className="pill-chip">{surface.meta}</span>
                </div>
              </div>
              <Link href={surface.href} className="block">
                <div className="overflow-hidden bg-muted/55 p-4">
                  <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                    <Image
                      src={surface.screenshot}
                      alt={surface.title}
                      className="h-auto w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                    />
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <LandingForm />

      <section className="grid gap-4 lg:grid-cols-3">
        {trustNotes.map((note) => {
          const Icon = note.icon;
          return (
            <article key={note.title} className="social-card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{note.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{note.body}</p>
            </article>
          );
        })}
      </section>

      <section className="social-card overflow-hidden px-6 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready for the domain switch</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">Keep the product name Pave. Let pavetrip.com do the routing work.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              We can launch a clearer public site, keep support and legal pages close by, and still preserve the product
              brand as Pave. That gives us a clean domain story without fragmenting the repo, the team, or the experience.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Start creating
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
            >
              Review trust pages
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

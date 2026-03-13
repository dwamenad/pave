import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PaveMark } from "@/components/pave-mark";
import createScreenshot from "@/docs/assets/screenshots/pave-smoke-create.png";
import feedScreenshot from "@/docs/assets/screenshots/pave-smoke-feed.png";
import nearbyScreenshot from "@/docs/assets/screenshots/pave-smoke-nearby.png";

const latestFromPave = [
  {
    title: "Create from inspiration",
    description: "Bring the saved links and captions that shaped the trip, then move into a structured draft.",
    href: "/create",
    image: createScreenshot
  },
  {
    title: "Explore the public feed",
    description: "Open real itineraries, save the good ones, and see what is worth remixing before you ever start from scratch.",
    href: "/feed",
    image: feedScreenshot
  },
  {
    title: "Open nearby context",
    description: "Keep place context close to the itinerary instead of scattering it across tabs.",
    href: "/nearby",
    image: nearbyScreenshot
  }
];

const productNotes = [
  "Live web product",
  "Mobile beta",
  "AI-assisted create flow",
  "Publish, save, and remix loops"
];

const resources = [
  { title: "Support", href: "/support" },
  { title: "Privacy", href: "/privacy" },
  { title: "Terms", href: "/terms" },
  { title: "Feed", href: "/feed" }
];

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border/70 bg-card">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <PaveMark className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xl font-extrabold tracking-tight">Pave</p>
              <p className="text-sm text-muted-foreground">pavetrip.com</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/feed"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Explore the app
            </Link>
            <Link
              href="/create"
              className="inline-flex min-h-11 items-center rounded-full border border-border px-5 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
            >
              Start with a trip
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-primary text-white">
        <div className="mx-auto grid min-h-[76vh] w-full max-w-[1440px] gap-8 px-6 py-10 md:px-10 lg:grid-cols-[0.6fr_1.4fr] lg:items-end lg:py-0">
          <div className="flex flex-col justify-end space-y-6 pb-6 lg:pb-16">
            <p className="text-xs font-bold uppercase tracking-[0.36em] text-white/70">Travel planning</p>
            <h1 className="text-6xl font-extrabold tracking-tight md:text-8xl">Pave</h1>
            <p className="max-w-sm text-lg leading-8 text-white/82">
              Turns saved travel posts, links, and captions into structured itineraries that are easy to review, share,
              and reuse.
            </p>
          </div>

          <div className="relative flex items-end justify-center lg:justify-end">
            <div className="absolute inset-y-10 left-14 right-0 rounded-[3.5rem] bg-white/12 blur-3xl" />
            <div className="relative w-full max-w-5xl overflow-hidden rounded-t-[3rem] bg-background p-4 shadow-[0_40px_140px_-42px_rgba(0,0,0,0.58)] md:p-5">
              <Image
                src={createScreenshot}
                alt="Pave create flow showing the itinerary builder working from social inspiration."
                className="h-auto w-full rounded-[2.2rem] object-cover object-top"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-20 px-6 py-18 md:px-10 md:py-24">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-start">
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">What Pave is doing now</p>
            <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">
              Start with social travel intent. End with a trip people can actually use.
            </h2>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground">
              Most products split discovery from planning. Pave connects them. You bring the source material that created
              the trip, Pave helps resolve the destination and shape the itinerary, and the result can be published,
              exported, and reused across the product.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                Turn inspiration into a plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/feed"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
              >
                See the public feed
              </Link>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-4 lg:pt-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Current product</p>
            <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
              {productNotes.map((note) => (
                <li key={note} className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                  {note}
                </li>
              ))}
            </ul>
            <p className="text-sm leading-7 text-muted-foreground">
              Current constraints are still real: no media upload pipeline yet, no realtime comments or voting, and feed
              ranking is still heuristic rather than model-served.
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Latest from Pave</p>
            <h2 className="text-3xl font-extrabold tracking-tight">Three places to start in the product.</h2>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            {latestFromPave.map((item) => (
              <article key={item.title} className="space-y-4">
                <Link href={item.href} className="block overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image src={item.image} alt={item.title} className="h-full w-full object-cover object-top" />
                  </div>
                </Link>
                <div className="space-y-2">
                  <Link href={item.href} className="text-xl font-bold tracking-tight hover:text-primary">
                    {item.title}
                  </Link>
                  <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Pave resources</p>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                Support, trust, and product edges all live in the same system. The public homepage stays simple; the app
                handles the heavier workflow once you move inside.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold">
              {resources.map((resource) => (
                <Link key={resource.title} href={resource.href} className="text-foreground hover:text-primary">
                  {resource.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

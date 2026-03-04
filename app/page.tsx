import Link from "next/link";
import { Camera, Compass, MapPinned } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function HomePage() {
  return (
    <div className="space-y-10 py-2">
      <section className="grid gap-8 rounded-2xl border bg-white p-6 md:grid-cols-2 md:p-8">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Compass className="h-3.5 w-3.5" />
            Social to itinerary
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Plan trips from what you discover online.
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Paste social links, generate a practical itinerary, remix community plans, and share your own travel flow.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/feed" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">
              Explore feed
            </Link>
            <Link href="/create" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-muted">
              Create itinerary
            </Link>
          </div>
        </div>
        <div className="relative min-h-52 overflow-hidden rounded-2xl border bg-gradient-to-tr from-primary/15 via-sky-100 to-teal-100 p-5">
          <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">What you can do</p>
            <p className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur">
              Convert Instagram/TikTok/YouTube links into a 1-3 day trip.
            </p>
            <p className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur">
              Remix itineraries from the feed and export PDFs.
            </p>
            <p className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur">
              Share trip links and collect group votes.
            </p>
          </div>
        </div>
      </section>

      <LandingForm />

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/nearby" className="surface-card group p-4 hover:border-primary">
          <MapPinned className="mb-2 h-5 w-5 text-primary" />
          <h2 className="font-bold">Nearby Now</h2>
          <p className="mt-1 text-sm text-muted-foreground">Get quick picks within 10-15 minutes on mobile.</p>
        </Link>
        <Link href="/feed" className="surface-card group p-4 hover:border-primary">
          <Camera className="mb-2 h-5 w-5 text-primary" />
          <h2 className="font-bold">Social Feed</h2>
          <p className="mt-1 text-sm text-muted-foreground">Discover public itineraries and remix travel ideas.</p>
        </Link>
        <Link href="/create" className="surface-card group p-4 hover:border-primary">
          <Compass className="mb-2 h-5 w-5 text-primary" />
          <h2 className="font-bold">Create</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use preferences and parsed hints to build your own plan.</p>
        </Link>
      </section>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Compass, MapPinned, Sparkles } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function HomePage() {
  return (
    <div className="space-y-12 py-2">
      <section className="grid gap-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:grid-cols-2 md:p-10">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI Powered Itineraries
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            Turn travel inspiration into action.
          </h1>
          <p className="text-base text-slate-600">
            Convert social links into practical itineraries, remix community plans, and share your own route in minutes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/feed" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">
              Explore feed
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/create" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary">
              Create itinerary
            </Link>
          </div>
        </div>

        <div className="relative min-h-64 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-tr from-primary/15 via-cyan-100 to-blue-100 p-5">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">What you can do</p>
            <p className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur">
              Convert Instagram/TikTok/YouTube links into 1-3 day plans.
            </p>
            <p className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur">
              Remix itinerary posts and publish to the social feed.
            </p>
            <p className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur">
              Share trip links and collect group votes.
            </p>
          </div>
        </div>
      </section>

      <LandingForm />

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/nearby" className="social-card p-5 hover:border-primary">
          <MapPinned className="mb-2 h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Nearby Now</h2>
          <p className="mt-1 text-sm text-slate-500">Quick location-based picks for food, coffee, and activities.</p>
        </Link>

        <Link href="/feed" className="social-card p-5 hover:border-primary">
          <Sparkles className="mb-2 h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Social Feed</h2>
          <p className="mt-1 text-sm text-slate-500">Discover public itineraries and remix travel ideas.</p>
        </Link>

        <Link href="/create" className="social-card p-5 hover:border-primary">
          <Compass className="mb-2 h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Create</h2>
          <p className="mt-1 text-sm text-slate-500">Tune preferences and generate plans from social context.</p>
        </Link>
      </section>
    </div>
  );
}

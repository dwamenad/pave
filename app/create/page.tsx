import { CreateItineraryForm } from "@/components/create-itinerary-form";
import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CreatePage({ searchParams }: { searchParams: { placeId?: string } }) {
  return (
    <div className="space-y-8">
      <section className="social-card overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Create workflow
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">Create from social inspiration</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add context and links, tune preferences, then generate and publish your itinerary.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/70 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Need more ideas first?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Explore trending posts and save references before creating. Your saved destination context can be used here.
            </p>
            <Link
              href="/feed"
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
            >
              <Compass className="h-3.5 w-3.5" />
              Open feed
            </Link>
          </div>
        </div>
      </section>
      <CreateItineraryForm initialPlaceId={searchParams.placeId} />
    </div>
  );
}

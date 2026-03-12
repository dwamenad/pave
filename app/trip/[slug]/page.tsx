import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Download, MapPinned, Share2, Sparkles, Vote } from "lucide-react";
import { ShareControls } from "@/components/share-controls";
import { TripBuilder } from "@/components/trip-builder";
import type { TripData } from "@/components/trip-builder";
import { TripSocialActions } from "@/components/trip-social-actions";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/server/events";
import { getTripBySlug, getVoteTotals } from "@/lib/server/trip-service";

export const dynamic = "force-dynamic";

export default async function TripPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { group?: string; st?: string };
}) {
  const trip = await getTripBySlug(params.slug);
  if (!trip) {
    notFound();
  }

  if (searchParams.st && searchParams.st.length <= 80) {
    const user = await getCurrentUser();
    const token = searchParams.st;

    await db.shareAttribution.updateMany({
      where: {
        token
      },
      data: {
        openedAt: new Date(),
        tripId: trip.id
      }
    });

    await trackEvent({
      name: "share_trip",
      userId: user?.id,
      sessionId: token,
      props: {
        tripId: trip.id,
        token,
        opened: true
      }
    });
  }

  const votes = await getVoteTotals(trip.id);
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_PUBLIC || "";
  const serializedTrip = JSON.parse(JSON.stringify(trip)) as TripData;

  return (
    <div className="space-y-7">
      <Link href="/feed" className="text-sm font-semibold text-primary hover:underline">
        Back to feed
      </Link>

      <section className="social-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{trip.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {trip.days.length} days
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPinned className="h-3.5 w-3.5" />
                Shareable itinerary
              </span>
              {trip.remixedInto[0]?.sourceTrip ? (
                <span>
                  Remixed from{" "}
                  <Link className="font-semibold text-primary hover:underline" href={`/trip/${trip.remixedInto[0].sourceTrip.slug}`}>
                    {trip.remixedInto[0].sourceTrip.title}
                  </Link>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Share2 className="h-3.5 w-3.5 text-primary" />
            Public + group share links available below
          </div>
        </div>
      </section>

      <section className="social-card p-4">
        <div className="flex flex-wrap gap-2">
          <a
            href="#trip-builder-section"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
          >
            <MapPinned className="h-3.5 w-3.5" />
            Planner view
          </a>
          <a
            href="#trip-share-controls"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share links
          </a>
          <a
            href="#trip-social-actions"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
          >
            <Vote className="h-3.5 w-3.5" />
            Remix + publish
          </a>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
            <Download className="h-3.5 w-3.5" />
            PDF export available
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section id="trip-builder-section" className="space-y-6 xl:col-span-8">
          <TripBuilder apiKey={apiKey} initialTrip={serializedTrip} groupToken={searchParams.group} initialVotes={votes} />
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <div id="trip-share-controls" className="social-card p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-foreground">
              <Share2 className="h-4 w-4 text-primary" />
              Share controls
            </h2>
            <ShareControls tripId={trip.id} />
          </div>

          <div id="trip-social-actions" className="social-card p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Social actions
            </h2>
            <TripSocialActions tripId={trip.id} tripTitle={trip.title} />
          </div>
        </aside>
      </div>
    </div>
  );
}

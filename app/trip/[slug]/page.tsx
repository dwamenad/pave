import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPinned, Share2, Sparkles } from "lucide-react";
import { ShareControls } from "@/components/share-controls";
import { TripBuilder } from "@/components/trip-builder";
import type { TripData } from "@/components/trip-builder";
import { TripSocialActions } from "@/components/trip-social-actions";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { trackEventWithActor } from "@/lib/server/events";
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

    await trackEventWithActor({
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
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{trip.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
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

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Share2 className="h-3.5 w-3.5 text-primary" />
            Public + group share links available below
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="space-y-6 xl:col-span-8">
          <TripBuilder apiKey={apiKey} initialTrip={serializedTrip} groupToken={searchParams.group} initialVotes={votes} />
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <div className="social-card p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-900">
              <Share2 className="h-4 w-4 text-primary" />
              Share controls
            </h2>
            <ShareControls tripId={trip.id} />
          </div>

          <div className="social-card p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-900">
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

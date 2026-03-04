import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareControls } from "@/components/share-controls";
import { TripBuilder } from "@/components/trip-builder";
import type { TripData } from "@/components/trip-builder";
import { TripSocialActions } from "@/components/trip-social-actions";
import { getTripBySlug, getVoteTotals } from "@/lib/server/trip-service";

export const dynamic = "force-dynamic";
export default async function TripPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { group?: string };
}) {
  const trip = await getTripBySlug(params.slug);
  if (!trip) {
    notFound();
  }

  const votes = await getVoteTotals(trip.id);
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_PUBLIC || "";
  const serializedTrip = JSON.parse(JSON.stringify(trip)) as TripData;

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">Back</Link>
      <div className="surface-card flex items-start justify-between gap-3 p-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{trip.title}</h1>
          <p className="text-sm text-muted-foreground">Shareable itinerary</p>
          {trip.remixedInto[0]?.sourceTrip ? (
            <p className="text-xs text-muted-foreground">
              Remixed from{" "}
              <Link className="underline" href={`/trip/${trip.remixedInto[0].sourceTrip.slug}`}>
                {trip.remixedInto[0].sourceTrip.title}
              </Link>
            </p>
          ) : null}
        </div>
        <ShareControls tripId={trip.id} />
      </div>
      <TripSocialActions tripId={trip.id} tripTitle={trip.title} />
      <TripBuilder apiKey={apiKey} initialTrip={serializedTrip} groupToken={searchParams.group} initialVotes={votes} />
    </div>
  );
}

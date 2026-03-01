import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceHubClient } from "@/components/place-hub-client";
import { placesProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";
async function fetchCategory(lat: number, lng: number, type: string) {
  return placesProvider.nearbySearch({ lat, lng, type, radiusMeters: 3000, minPrice: 2, maxPrice: 2 });
}

export default async function PlaceHubPage({ params }: { params: { placeId: string } }) {
  let place;
  try {
    place = await placesProvider.placeDetails(params.placeId);
  } catch {
    notFound();
  }

  const [eat, stay, todo] = await Promise.all([
    fetchCategory(place.lat, place.lng, "restaurant"),
    fetchCategory(place.lat, place.lng, "lodging"),
    fetchCategory(place.lat, place.lng, "tourist_attraction")
  ]);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY_PUBLIC || "";

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">Back</Link>
      <header className="surface-card p-5">
        <h1 className="text-3xl font-extrabold tracking-tight">{place.name}</h1>
        <p className="text-sm text-muted-foreground">{place.address}</p>
        <Link href={`/create?placeId=${params.placeId}`} className="mt-1 inline-block text-xs font-semibold text-primary underline">
          Share generated itinerary as a post
        </Link>
      </header>
      <PlaceHubClient
        apiKey={apiKey}
        placeId={params.placeId}
        initial={{
          place,
          byCategory: {
            eat,
            stay,
            do: todo
          }
        }}
      />
    </div>
  );
}

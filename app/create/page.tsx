import { CreateItineraryForm } from "@/components/create-itinerary-form";

export const dynamic = "force-dynamic";
export default function CreatePage({ searchParams }: { searchParams: { placeId?: string } }) {
  return <CreateItineraryForm initialPlaceId={searchParams.placeId} />;
}

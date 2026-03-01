import { CreateItineraryForm } from "@/components/create-itinerary-form";

export const dynamic = "force-dynamic";
export default function CreatePage({ searchParams }: { searchParams: { placeId?: string } }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Create from social inspiration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add caption + links, choose preferences, then generate and publish your itinerary.
        </p>
      </section>
      <CreateItineraryForm initialPlaceId={searchParams.placeId} />
    </div>
  );
}

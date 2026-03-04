import { CreateItineraryForm } from "@/components/create-itinerary-form";

export const dynamic = "force-dynamic";

export default function CreatePage({ searchParams }: { searchParams: { placeId?: string } }) {
  return (
    <div className="space-y-8">
      <section className="social-card p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create from social inspiration</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add context and links, tune preferences, then generate and publish your itinerary.
        </p>
      </section>
      <CreateItineraryForm initialPlaceId={searchParams.placeId} />
    </div>
  );
}

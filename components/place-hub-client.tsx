"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Hotel, RefreshCw, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { MapView } from "@/components/map-view";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import type { BudgetMode, HubCategory, PlaceCard as PlaceCardType } from "@/lib/types";

type HubData = {
  place: PlaceCardType;
  byCategory: Record<HubCategory, PlaceCardType[]>;
};

const categoryUi: Record<HubCategory, { label: string; icon: LucideIcon }> = {
  eat: { label: "Eat", icon: UtensilsCrossed },
  stay: { label: "Stay", icon: Hotel },
  do: { label: "Do", icon: Compass }
};

export function PlaceHubClient({
  apiKey,
  initial,
  placeId
}: {
  apiKey: string;
  initial: HubData;
  placeId: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<HubCategory>("eat");
  const [budget, setBudget] = useState<BudgetMode>("mid");
  const [radius, setRadius] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | undefined>();
  const [byCategory, setByCategory] = useState(initial.byCategory);

  const activePlaces = byCategory[category] || [];

  const allVisible = useMemo(() => {
    const map = new Map<string, PlaceCardType>();
    Object.values(byCategory)
      .flat()
      .forEach((p) => map.set(p.placeId, p));
    return Array.from(map.values());
  }, [byCategory]);

  async function refreshCategory(next: HubCategory) {
    setCategory(next);
    setLoading(true);
    try {
      const type = next === "eat" ? "restaurant" : next === "stay" ? "lodging" : "tourist_attraction";
      const response = await fetch(
        `/api/places/nearby?lat=${initial.place.lat}&lng=${initial.place.lng}&type=${type}&radius=${radius}&budget=${budget}`
      );
      const data = await response.json();
      setByCategory((prev) => ({ ...prev, [next]: data.places || [] }));
    } finally {
      setLoading(false);
    }
  }

  async function createTrip() {
    setLoading(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          title: `${initial.place.name} Plan`,
          centerLat: initial.place.lat,
          centerLng: initial.place.lng,
          days: 2,
          budget
        })
      });

      const data = await response.json();
      if (data.trip?.slug) {
        router.push(`/trip/${data.trip.slug}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(categoryUi) as HubCategory[]).map((value) => {
          const ui = categoryUi[value];
          const Icon = ui.icon;

          return (
            <button
              key={value}
              className={
                category === value
                  ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
                  : "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
              }
              onClick={() => refreshCategory(value)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {ui.label}
            </button>
          );
        })}

        <select value={budget} onChange={(e) => setBudget(e.target.value as BudgetMode)} className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="budget">Budget</option>
          <option value="mid">Mid</option>
          <option value="luxury">Luxury</option>
        </select>

        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value={2000}>2 km</option>
          <option value={3000}>3 km</option>
          <option value={5000}>5 km</option>
        </select>

        <Button onClick={() => refreshCategory(category)} variant="outline" disabled={loading} className="rounded-lg">
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </Button>
        <Button onClick={createTrip} disabled={loading} className="rounded-lg">Create trip</Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
        <aside className="max-h-[700px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {activePlaces.length ? (
            activePlaces.map((place) => (
              <PlaceCard key={place.placeId} place={place} focused={focused === place.placeId} onClick={() => setFocused(place.placeId)} />
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              No places found. Try a different radius or category.
            </div>
          )}
        </aside>

        <section className="space-y-3">
          <div className="social-card p-3">
            <MapView
              apiKey={apiKey}
              center={{ lat: initial.place.lat, lng: initial.place.lng }}
              places={allVisible}
              highlightedPlaceId={focused}
              onPinClick={setFocused}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

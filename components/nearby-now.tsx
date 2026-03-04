"use client";

import { useMemo, useState } from "react";
import { Coffee, LocateFixed, MapPin, Star, UtensilsCrossed, WandSparkles, type LucideIcon } from "lucide-react";
import type { PlaceCard as PlaceCardType } from "@/lib/types";
import {
  getNearbyPlacesByCategory,
  normalizeNearbyCategory,
  type NearbyCategory,
  type NearbyPayload
} from "@/lib/nearby-view-model";

const categoryMeta: Record<NearbyCategory, { label: string; icon: LucideIcon }> = {
  eat: { label: "Nearby Eat", icon: UtensilsCrossed },
  coffee: { label: "Nearby Coffee", icon: Coffee },
  do: { label: "Nearby Do", icon: WandSparkles }
};

function formatRating(place: PlaceCardType) {
  if (!place.rating) return "No rating";
  const reviews = place.userRatingsTotal ? ` (${place.userRatingsTotal})` : "";
  return `${place.rating.toFixed(1)}${reviews}`;
}

export function NearbyNow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [data, setData] = useState<NearbyPayload | null>(null);
  const [activeCategory, setActiveCategory] = useState<NearbyCategory>(normalizeNearbyCategory());

  const activePlaces = useMemo(() => {
    return getNearbyPlacesByCategory(data, activeCategory);
  }, [activeCategory, data]);

  async function fetchNearby(position: GeolocationPosition) {
    const { latitude, longitude } = position.coords;
    setCoords({ lat: latitude, lng: longitude });

    const response = await fetch(`/api/nearby?lat=${latitude}&lng=${longitude}`);
    if (!response.ok) {
      throw new Error("nearby_fetch_failed");
    }

    const payload = (await response.json()) as NearbyPayload;
    setData(payload);
  }

  async function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetchNearby(position);
        } catch {
          setError("Failed to load nearby picks.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("Location permission denied. Enable location and try again.");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Nearby Now</h1>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4 text-primary" />
            {coords
              ? `Showing spots near ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`
              : "Use your location to discover nearby spots."}
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary"
          onClick={locate}
          type="button"
        >
          <LocateFixed className="h-4 w-4" />
          {loading ? "Locating..." : "Change Location"}
        </button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-tr from-slate-200 via-sky-100 to-cyan-100 p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(19,182,236,0.25),transparent_55%)]" />
        <div className="relative z-10">
          <div className="mb-5 flex flex-wrap gap-3">
            {(Object.keys(categoryMeta) as NearbyCategory[]).map((key) => {
              const meta = categoryMeta[key];
              const Icon = meta.icon;
              const active = activeCategory === key;

              return (
                <button
                  key={key}
                  className={
                    active
                      ? "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
                      : "inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 hover:text-primary"
                  }
                  onClick={() => setActiveCategory(key)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {meta.label}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-slate-600">Quick picks with strong ratings and short travel distance.</p>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {data ? (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Highly Rated Nearby</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {activePlaces.length} spots
            </span>
          </div>

          {activePlaces.length ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {activePlaces.map((place) => (
                <article key={place.placeId} className="social-card overflow-hidden hover:shadow-md">
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    {place.photoUrl ? (
                      <img alt={place.name} className="h-full w-full object-cover" src={place.photoUrl} />
                    ) : (
                      <div className="social-floating-gradient h-full w-full" />
                    )}
                    <span className="absolute right-3 top-3 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-700">
                      {place.types[0] || activeCategory}
                    </span>
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-slate-900">{place.name}</h3>
                      <span className="text-xs font-bold text-primary">Nearby</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-500">{place.address || "Address unavailable"}</p>
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {formatRating(place)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="social-empty-panel">
              No nearby spots found for this category yet. Try another category or refresh location.
            </div>
          )}
        </section>
      ) : (
        <div className="social-empty-panel">
          <p className="font-semibold text-slate-700">Ready when you are</p>
          <p className="mt-1">Tap “Change Location” to load nearby places for eat, coffee, and things to do.</p>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          aria-label="Locate nearby spots"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl"
          onClick={locate}
          type="button"
        >
          <LocateFixed className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

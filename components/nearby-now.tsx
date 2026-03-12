"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Coffee,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Star,
  UtensilsCrossed,
  WandSparkles,
  type LucideIcon
} from "lucide-react";
import type { PlaceCard as PlaceCardType } from "@/lib/types";
import {
  getNearbyPlacesByCategory,
  normalizeNearbyCategory,
  type NearbyCategory,
  type NearbyPayload
} from "@/lib/nearby-view-model";

const categoryMeta: Record<NearbyCategory, { label: string; icon: LucideIcon; tint: string }> = {
  eat: { label: "Nearby Eat", icon: UtensilsCrossed, tint: "bg-orange-100 text-orange-700" },
  coffee: { label: "Nearby Coffee", icon: Coffee, tint: "bg-amber-100 text-amber-700" },
  do: { label: "Nearby Do", icon: WandSparkles, tint: "bg-sky-100 text-sky-700" }
};

function formatRating(place: PlaceCardType) {
  if (!place.rating) return "No rating";
  const reviews = place.userRatingsTotal ? ` (${place.userRatingsTotal})` : "";
  return `${place.rating.toFixed(1)}${reviews}`;
}

function geolocationErrorMessage(code?: number) {
  if (code === 1) return "Location permission denied. Enable location access and try again.";
  if (code === 2) return "Location unavailable right now. Check your signal and retry.";
  if (code === 3) return "Location request timed out. Try again or move to an open area.";
  return "Unable to determine your location. Please try again.";
}

function nearbyReasonCopy(reasonCode?: string, stale?: boolean) {
  if (stale) {
    return "Live place data is temporarily unavailable, so you are seeing cached nearby results.";
  }
  if (reasonCode === "provider_misconfigured") {
    return "The nearby provider is not configured yet in this environment.";
  }
  if (reasonCode === "rate_limited") {
    return "Nearby search is being rate limited right now. Give it a moment and retry.";
  }
  if (reasonCode === "invalid_request") {
    return "The nearby request could not be completed. Try refreshing your location.";
  }
  return "Nearby data could not be loaded right now. Try again in a moment.";
}

function emptyStateCopy(category: NearbyCategory) {
  if (category === "eat") return "No food spots matched this area yet. Try refreshing your location or switch to coffee or nearby things to do.";
  if (category === "coffee") return "No coffee spots matched this area yet. Try refreshing your location or switch to food or things to do.";
  return "No activity picks matched this area yet. Try refreshing your location or switch to food or coffee.";
}

export function NearbyNow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [data, setData] = useState<NearbyPayload | null>(null);
  const [activeCategory, setActiveCategory] = useState<NearbyCategory>(normalizeNearbyCategory());

  const activePlaces = useMemo(() => getNearbyPlacesByCategory(data, activeCategory), [activeCategory, data]);

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
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetchNearby(position);
        } catch {
          setError("Nearby data could not be loaded. Please retry.");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        setError(geolocationErrorMessage(geoError.code));
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
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-60"
          onClick={locate}
          type="button"
          disabled={loading}
        >
          <LocateFixed className="h-4 w-4" />
          {loading ? "Locating..." : "Change Location"}
        </button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-sky-100 to-cyan-100 p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.35),transparent_52%)]" />
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
                      ? "inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                      : "inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
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

          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(categoryMeta) as NearbyCategory[]).map((key) => {
              const meta = categoryMeta[key];
              const Icon = meta.icon;
              return (
                <button
                  key={`quick-${key}`}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className="group flex min-h-16 items-center gap-3 rounded-xl bg-white/90 px-4 py-3 text-left shadow-sm transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${meta.tint}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-slate-800 group-hover:text-primary">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="inline-flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Nearby unavailable
          </p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={locate}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry location
          </button>
        </div>
      ) : null}

      {data?.degraded ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border p-4 text-sm ${data.stale ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}
        >
          <p className="inline-flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {data.stale ? "Using cached nearby results" : "Nearby data is degraded"}
          </p>
          <p className="mt-1">{nearbyReasonCopy(data.reasonCode, data.stale)}</p>
        </div>
      ) : null}

      {data?.mockMode ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-slate-700" role="status" aria-live="polite">
          <p className="font-semibold text-primary">Mock place mode is active.</p>
          <p className="mt-1">These nearby spots are coming from the local demo dataset instead of the live provider.</p>
        </div>
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
              <p className="font-semibold text-slate-700">No places in this category yet.</p>
              <p className="mt-1">{emptyStateCopy(activeCategory)}</p>
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
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          onClick={locate}
          type="button"
          disabled={loading}
        >
          {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

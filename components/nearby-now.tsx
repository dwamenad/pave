"use client";

import { useState } from "react";
import { Compass, Coffee, MapPinned, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceCard } from "@/components/place-card";
import type { PlaceCard as PlaceCardType } from "@/lib/types";

export function NearbyNow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<{ eat: PlaceCardType[]; coffee: PlaceCardType[]; do: PlaceCardType[] } | null>(null);

  async function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/nearby?lat=${latitude}&lng=${longitude}`);
          const payload = await response.json();
          setData(payload);
        } catch {
          setError("Failed to load nearby picks.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("Location permission denied.");
      },
      { enableHighAccuracy: false, timeout: 7000 }
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/15 via-sky-100 to-teal-100 p-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Nearby Now</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quick picks within roughly 10-15 minutes.</p>
          <Button onClick={locate} className="mt-4 rounded-xl font-bold" disabled={loading}>
            <MapPinned className="mr-2 h-4 w-4" />
            {loading ? "Loading..." : "Use my location"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>

      {data ? (
        <div className="space-y-4">
          {(["eat", "coffee", "do"] as const).map((section) => (
            <section key={section} className="surface-card space-y-3 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                {section === "eat" ? <Utensils className="h-4 w-4 text-primary" /> : null}
                {section === "coffee" ? <Coffee className="h-4 w-4 text-primary" /> : null}
                {section === "do" ? <Compass className="h-4 w-4 text-primary" /> : null}
                {section}
              </h2>
              <div className="grid gap-2 md:grid-cols-2">
                {data[section].map((place) => (
                  <PlaceCard key={place.placeId} place={place} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

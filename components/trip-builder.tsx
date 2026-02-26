"use client";

import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { MapView } from "@/components/map-view";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TripData = {
  id: string;
  slug: string;
  title: string;
  centerLat: number;
  centerLng: number;
  days: Array<{
    id: string;
    dayIndex: number;
    items: Array<{
      id: string;
      placeId: string;
      name: string;
      lat: number;
      lng: number;
      category: string;
      notes: string | null;
      orderIndex: number;
    }>;
  }>;
};

export function TripBuilder({ apiKey, initialTrip, groupToken, initialVotes }: {
  apiKey: string;
  initialTrip: TripData;
  groupToken?: string;
  initialVotes: Record<string, { up: number; down: number }>;
}) {
  const [trip, setTrip] = useState(initialTrip);
  const [focused, setFocused] = useState<string | undefined>();
  const [votes, setVotes] = useState(initialVotes);
  const [addDayId, setAddDayId] = useState(initialTrip.days[0]?.id ?? "");
  const [addQuery, setAddQuery] = useState("");
  const [viewMode, setViewMode] = useState<"both" | "map" | "list">("both");
  const places = useMemo(
    () => trip.days.flatMap((day) => day.items.map((item) => ({ ...item, types: [], placeId: item.placeId }))),
    [trip.days]
  );

  async function reorder(dayId: string, orderedItemIds: string[]) {
    await fetch(`/api/trips/${trip.id}/items/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId, orderedItemIds })
    });
  }

  async function move(itemId: string, toDayId: string) {
    await fetch(`/api/trips/${trip.id}/items/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, toDayId })
    });
  }

  async function addPlace() {
    if (!addQuery.trim() || !addDayId) return;
    const suggestionsRes = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(addQuery)}`);
    const suggestionsData = await suggestionsRes.json();
    const suggestion = suggestionsData.suggestions?.[0];
    if (!suggestion?.placeId) return;

    const detailsRes = await fetch(`/api/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`);
    const detailsData = await detailsRes.json();
    const place = detailsData.place;
    if (!place) return;

    const response = await fetch(`/api/trips/${trip.id}/items/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayId: addDayId,
        place: {
          placeId: place.placeId,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          category: "do",
          notes: "Manually added by trip editor."
        }
      })
    });
    const data = await response.json();
    if (!data.item) return;

    setTrip((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === addDayId
          ? {
              ...day,
              items: [...day.items, data.item]
            }
          : day
      )
    }));
    setAddQuery("");
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/trips/${trip.id}/items/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId })
    });

    setTrip((prev) => ({
      ...prev,
      days: prev.days.map((day) => ({
        ...day,
        items: day.items.filter((item) => item.id !== itemId)
      }))
    }));
  }

  function onDragStart(e: DragEvent<HTMLElement>, itemId: string) {
    e.dataTransfer.setData("itemId", itemId);
  }

  async function onDrop(e: DragEvent<HTMLElement>, dayId: string) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");

    setTrip((prev) => {
      const fromDay = prev.days.find((d) => d.items.some((i) => i.id === itemId));
      const targetDay = prev.days.find((d) => d.id === dayId);
      if (!fromDay || !targetDay) return prev;

      const item = fromDay.items.find((i) => i.id === itemId);
      if (!item) return prev;

      const next = {
        ...prev,
        days: prev.days.map((day) => {
          if (day.id === fromDay.id) {
            return { ...day, items: day.items.filter((i) => i.id !== itemId) };
          }
          if (day.id === targetDay.id) {
            return { ...day, items: [...day.items, { ...item, orderIndex: day.items.length }] };
          }
          return day;
        })
      };
      return next;
    });

    await move(itemId, dayId);
  }

  async function vote(placeId: string, voteValue: 1 | -1) {
    await fetch(`/api/trips/${trip.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, voteValue, groupToken })
    });

    setVotes((prev) => {
      const current = prev[placeId] || { up: 0, down: 0 };
      return {
        ...prev,
        [placeId]: {
          up: voteValue === 1 ? current.up + 1 : current.up,
          down: voteValue === -1 ? current.down + 1 : current.down
        }
      };
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded border px-2 py-1 text-sm" value={addDayId} onChange={(e) => setAddDayId(e.target.value)}>
            {trip.days.map((day) => (
              <option key={day.id} value={day.id}>
                Day {day.dayIndex}
              </option>
            ))}
          </select>
          <Input className="max-w-xs" placeholder="Add place to trip" value={addQuery} onChange={(e) => setAddQuery(e.target.value)} />
          <Button variant="outline" onClick={addPlace}>Add place</Button>
          <div className="ml-auto flex gap-1">
            <Button variant={viewMode === "map" ? "default" : "outline"} onClick={() => setViewMode("map")}>Map</Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>List</Button>
            <Button variant={viewMode === "both" ? "default" : "outline"} onClick={() => setViewMode("both")}>Both</Button>
          </div>
        </div>
      </div>

      {viewMode !== "list" ? (
        <MapView apiKey={apiKey} center={{ lat: trip.centerLat, lng: trip.centerLng }} places={places} highlightedPlaceId={focused} onPinClick={setFocused} />
      ) : null}

      {viewMode !== "map" ? (
      <div className="grid gap-4 md:grid-cols-3">
        {trip.days.map((day) => (
          <section
            key={day.id}
            className="rounded-lg border bg-white p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, day.id)}
          >
            <h3 className="mb-2 text-sm font-semibold">Day {day.dayIndex}</h3>
            <div className="space-y-2">
              {day.items
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((item, index) => (
                  <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)}>
                    <PlaceCard
                      place={{
                        placeId: item.placeId,
                        name: item.name,
                        lat: item.lat,
                        lng: item.lng,
                        types: [item.category],
                        address: item.notes ?? undefined
                      }}
                      focused={focused === item.placeId}
                      onClick={() => setFocused(item.placeId)}
                      footer={
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={async () => {
                                if (index === 0) return;
                                const ids = [...day.items].sort((a, b) => a.orderIndex - b.orderIndex).map((i) => i.id);
                                [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                                setTrip((prev) => ({
                                  ...prev,
                                  days: prev.days.map((d) =>
                                    d.id === day.id
                                      ? {
                                          ...d,
                                          items: ids.map((id, idx) => ({
                                            ...d.items.find((i) => i.id === id)!,
                                            orderIndex: idx
                                          }))
                                        }
                                      : d
                                  )
                                }));
                                await reorder(day.id, ids);
                              }}
                            >
                              Up
                            </Button>
                            <Button
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Button className="h-7 px-2" variant="ghost" onClick={() => vote(item.placeId, 1)} disabled={!groupToken}>Upvote</Button>
                            <span>{votes[item.placeId]?.up ?? 0}</span>
                            <Button className="h-7 px-2" variant="ghost" onClick={() => vote(item.placeId, -1)} disabled={!groupToken}>Downvote</Button>
                            <span>{votes[item.placeId]?.down ?? 0}</span>
                          </div>
                        </div>
                      }
                    />
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
      ) : null}
      {!groupToken ? <p className="text-xs text-muted-foreground">Open this trip with a group invite token to enable voting.</p> : null}
    </div>
  );
}

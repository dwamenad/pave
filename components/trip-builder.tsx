"use client";

import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { CalendarDays, ChevronDown, GripVertical, ListChecks, Map, MapPinned, Plus, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { MapView } from "@/components/map-view";
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

function sortedItems(day: TripData["days"][number]) {
  return [...day.items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function dayTitle(day: TripData["days"][number]) {
  const first = sortedItems(day)[0];
  return first ? `Day ${day.dayIndex}: ${first.name}` : `Day ${day.dayIndex}: Build your plan`;
}

export function TripBuilder({
  apiKey,
  initialTrip,
  groupToken,
  initialVotes
}: {
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
  const totalStops = useMemo(() => trip.days.reduce((sum, day) => sum + day.items.length, 0), [trip.days]);

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

      return {
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
    <div className="space-y-6">
      <div className="social-card p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted p-3">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              Itinerary Days
            </p>
            <p className="mt-1 text-xl font-extrabold text-foreground">{trip.days.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted p-3">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              Planned Stops
            </p>
            <p className="mt-1 text-xl font-extrabold text-foreground">{totalStops}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted p-3">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Map className="h-3.5 w-3.5 text-primary" />
              View Mode
            </p>
            <p className="mt-1 text-xl font-extrabold text-foreground">{viewMode.toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="social-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" value={addDayId} onChange={(e) => setAddDayId(e.target.value)}>
            {trip.days.map((day) => (
              <option key={day.id} value={day.id}>
                Day {day.dayIndex}
              </option>
            ))}
          </select>

          <Input
            className="max-w-xs rounded-lg"
            placeholder="Add activity or restaurant"
            value={addQuery}
            onChange={(e) => setAddQuery(e.target.value)}
          />

          <Button variant="outline" onClick={addPlace} className="rounded-lg">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add place
          </Button>

          <div className="ml-auto flex gap-1 rounded-lg border border-border bg-card p-1">
            <Button variant={viewMode === "map" ? "default" : "ghost"} onClick={() => setViewMode("map")} className="h-8 rounded-md px-3">
              Map
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")} className="h-8 rounded-md px-3">
              List
            </Button>
            <Button variant={viewMode === "both" ? "default" : "ghost"} onClick={() => setViewMode("both")} className="h-8 rounded-md px-3">
              Both
            </Button>
          </div>
        </div>
      </div>

      {viewMode !== "list" ? (
        <div className="social-card p-3">
          <MapView
            apiKey={apiKey}
            center={{ lat: trip.centerLat, lng: trip.centerLng }}
            places={places}
            highlightedPlaceId={focused}
            onPinClick={setFocused}
          />
        </div>
      ) : null}

      {viewMode !== "map" ? (
        <div className="space-y-4">
          {trip.days.map((day) => {
            const ordered = sortedItems(day);

            return (
              <section
                key={day.id}
                className="social-card overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, day.id)}
              >
                <details open={day.dayIndex === 1} className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 bg-muted px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Day {day.dayIndex}</p>
                      <h3 className="text-lg font-bold text-foreground">{dayTitle(day)}</h3>
                      <p className="text-xs text-muted-foreground">{ordered.length} planned stops</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="space-y-3 border-t border-border p-5">
                    {ordered.map((item, index) => (
                      <article
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.id)}
                        className="rounded-xl border border-border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <button className="rounded-md p-1 text-muted-foreground/70 hover:text-muted-foreground" type="button" aria-label="Drag item">
                            <GripVertical className="h-4 w-4" />
                          </button>

                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{item.category.replace(/_/g, " ")}</p>
                            <h4 className="text-base font-bold text-foreground">{item.name}</h4>
                            {item.notes ? <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p> : null}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                className="h-8 rounded-md px-2 text-xs"
                                onClick={async () => {
                                  if (index === 0) return;
                                  const ids = ordered.map((i) => i.id);
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
                                Move up
                              </Button>
                              <Button
                                variant="outline"
                                className="h-8 rounded-md px-2 text-xs"
                                onClick={async () => {
                                  if (index === ordered.length - 1) return;
                                  const ids = ordered.map((i) => i.id);
                                  [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
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
                                Move down
                              </Button>

                              <Button
                                variant="outline"
                                className="h-8 rounded-md px-2 text-xs"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Remove
                              </Button>

                              <button
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground hover:text-primary"
                                onClick={() => setFocused(item.placeId)}
                                type="button"
                              >
                                <MapPinned className="h-3.5 w-3.5" />
                                Focus on map
                              </button>

                              <div className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
                                <Button
                                  className="h-7 rounded-md px-2"
                                  variant="ghost"
                                  onClick={() => vote(item.placeId, 1)}
                                  disabled={!groupToken}
                                >
                                  <ThumbsUp className="mr-1 h-3.5 w-3.5" />
                                  {votes[item.placeId]?.up ?? 0}
                                </Button>
                                <Button
                                  className="h-7 rounded-md px-2"
                                  variant="ghost"
                                  onClick={() => vote(item.placeId, -1)}
                                  disabled={!groupToken}
                                >
                                  <ThumbsDown className="mr-1 h-3.5 w-3.5" />
                                  {votes[item.placeId]?.down ?? 0}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}

                    {!ordered.length ? (
                      <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                        No activities yet. Use &quot;Add place&quot; above to populate this day.
                      </div>
                    ) : null}
                  </div>
                </details>
              </section>
            );
          })}
        </div>
      ) : null}

      {!groupToken ? (
        <div className="rounded-xl border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
          Open this trip with a group invite token to enable voting.
        </div>
      ) : null}
    </div>
  );
}

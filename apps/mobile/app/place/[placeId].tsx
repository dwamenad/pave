/* eslint-disable jsx-a11y/alt-text */
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/src/components/ui-states";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";

type PlaceCard = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  address?: string;
  photoUrl?: string;
  types: string[];
};

type PlaceDetailsResponse = {
  place?: PlaceCard;
};

type NearbyResponse = {
  places: PlaceCard[];
};

type HubCategory = "eat" | "stay" | "do";

const PRIMARY = "#13b6ec";
const CATEGORY_TYPE: Record<HubCategory, string> = {
  eat: "restaurant",
  stay: "lodging",
  do: "tourist_attraction"
};

function formatPrice(level?: number) {
  if (!Number.isFinite(level)) return "$$";
  return "$".repeat(Math.max(1, Math.min(4, (level ?? 1) + 1)));
}

function categoryBadge(category: HubCategory) {
  if (category === "eat") return { icon: "restaurant-outline" as const, label: "Eat" };
  if (category === "stay") return { icon: "bed-outline" as const, label: "Stay" };
  return { icon: "compass-outline" as const, label: "Do" };
}

export default function PlaceHubScreen() {
  const params = useLocalSearchParams<{ placeId: string }>();
  const placeId = typeof params.placeId === "string" ? params.placeId : "";
  const api = useMobileApiClient();
  const router = useRouter();
  const [category, setCategory] = useState<HubCategory>("eat");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const placeQuery = useQuery({
    queryKey: ["mobile-place-details", placeId],
    enabled: Boolean(placeId),
    queryFn: () => api.get<PlaceDetailsResponse>(`/api/place/${placeId}`)
  });

  const nearbyQuery = useQuery({
    queryKey: ["mobile-place-hub", placeId, category, placeQuery.data?.place?.lat, placeQuery.data?.place?.lng],
    enabled: Boolean(placeQuery.data?.place),
    queryFn: () =>
      api.get<NearbyResponse>(
        `/api/places/nearby?lat=${placeQuery.data!.place!.lat}&lng=${placeQuery.data!.place!.lng}&type=${CATEGORY_TYPE[category]}&radius=3000&budget=mid`
      )
  });

  const list = useMemo(() => nearbyQuery.data?.places || [], [nearbyQuery.data?.places]);
  const hero = placeQuery.data?.place;

  if (placeQuery.isLoading) {
    return <LoadingState label="Loading place hub..." />;
  }

  if (placeQuery.isError || !hero) {
    return <ErrorState message="Failed to load this place." onRetry={() => placeQuery.refetch()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f8f8" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
          backgroundColor: "#f6f8f8"
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>

        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Pave</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search places"
          style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="search" size={20} color="#0f172a" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
          <View style={{ borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" }}>
            {hero.photoUrl ? (
              <Image source={{ uri: hero.photoUrl }} style={{ width: "100%", aspectRatio: 16 / 9 }} resizeMode="cover" />
            ) : (
              <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="map-outline" size={28} color={PRIMARY} />
              </View>
            )}

            <View style={{ position: "absolute", top: 10, right: 10, gap: 8 }}>
              <Pressable style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "#ffffffEA", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="locate" size={16} color={PRIMARY} />
              </Pressable>
              <Pressable style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "#ffffffEA", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="layers-outline" size={16} color="#475569" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f6f8f8" }}>
          <View style={{ flexDirection: "row", paddingHorizontal: 14 }}>
            {(["eat", "stay", "do"] as HubCategory[]).map((tab) => {
              const active = tab === category;
              const badge = categoryBadge(tab);
              return (
                <Pressable
                  key={tab}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${badge.label} places`}
                  onPress={() => setCategory(tab)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    borderBottomWidth: 2,
                    borderBottomColor: active ? PRIMARY : "transparent",
                    paddingTop: 12,
                    paddingBottom: 10,
                    gap: 4
                  }}
                >
                  <Ionicons name={badge.icon} size={17} color={active ? PRIMARY : "#64748b"} />
                  <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: active ? PRIMARY : "#64748b" }}>
                    {badge.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
            <Pressable style={{ borderRadius: 10, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#334155" }}>Budget</Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </Pressable>
            <Pressable style={{ borderRadius: 10, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#334155" }}>Radius</Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </Pressable>
            <Pressable style={{ borderRadius: 10, backgroundColor: "#13b6ec1A", borderWidth: 1, borderColor: "#13b6ec66", paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: PRIMARY }}>Cuisine</Text>
              <Ionicons name="options-outline" size={14} color={PRIMARY} />
            </Pressable>
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>{hero.name}</Text>
          <Text style={{ marginTop: -4, color: "#64748b" }} numberOfLines={2}>
            {hero.address || "Live local discovery powered by Pave."}
          </Text>

          {nearbyQuery.isLoading ? <LoadingState label="Loading nearby spots..." /> : null}
          {nearbyQuery.isError ? <ErrorState message="Could not load nearby places." onRetry={() => nearbyQuery.refetch()} /> : null}

          {!nearbyQuery.isLoading && !nearbyQuery.isError
            ? list.map((place, index) => {
                const liked = Boolean(favorites[place.placeId]);
                const distanceMiles = (0.5 + index * 0.4).toFixed(1);
                return (
                  <View
                    key={place.placeId}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      backgroundColor: "#fff",
                      overflow: "hidden"
                    }}
                  >
                    <View style={{ position: "relative" }}>
                      {place.photoUrl ? (
                        <Image source={{ uri: place.photoUrl }} style={{ width: "100%", height: 180, backgroundColor: "#e2e8f0" }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: "100%", height: 180, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="image-outline" size={26} color="#0284c7" />
                        </View>
                      )}

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={liked ? `Unsave ${place.name}` : `Save ${place.name}`}
                        onPress={() => setFavorites((prev) => ({ ...prev, [place.placeId]: !prev[place.placeId] }))}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#ffffffE8"
                        }}
                      >
                        <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? "#ef4444" : "#94a3b8"} />
                      </Pressable>
                    </View>

                    <View style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <Text style={{ flex: 1, fontSize: 17, fontWeight: "800", color: "#0f172a" }} numberOfLines={1}>
                          {place.name}
                        </Text>
                        <View style={{ borderRadius: 6, backgroundColor: "#13b6ec1A", paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 2 }}>
                          <Ionicons name="star" size={12} color={PRIMARY} />
                          <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: "800" }}>
                            {(place.rating ?? 4.7).toFixed(1)}
                          </Text>
                        </View>
                      </View>

                      <Text style={{ marginTop: 4, color: "#64748b", fontSize: 13 }} numberOfLines={1}>
                        {place.address || "Discover a great local spot"}
                      </Text>

                      <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ color: "#334155", fontWeight: "700", fontSize: 13 }}>
                          {formatPrice(place.priceLevel)} • {distanceMiles} miles away
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`View details for ${place.name}`}
                          onPress={() => router.push(`/place/${place.placeId}`)}
                          style={{ borderRadius: 8, backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 8 }}
                        >
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>View Details</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            : null}
        </View>
      </ScrollView>
    </View>
  );
}

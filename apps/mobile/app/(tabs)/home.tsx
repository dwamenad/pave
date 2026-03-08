/* eslint-disable jsx-a11y/alt-text */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/src/components/ui-states";
import { trackMobileError } from "@/src/lib/mobile-analytics";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";

type NearbyPlace = {
  placeId: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  address?: string;
  photoUrl?: string;
  types: string[];
};

type NearbyResponse = {
  eat: NearbyPlace[];
  coffee: NearbyPlace[];
  do: NearbyPlace[];
  degraded?: boolean;
};

type NearbyCategory = "eat" | "coffee" | "do";

const PRIMARY = "#13b6ec";
const DEFAULT_COORDS = { lat: 40.758, lng: -73.9855 };
const MAP_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBV5VdkoWqQXVnwR5b_u-5CM5HgOeSuEL4A3RPrulQElwB-dXNgNISdROWZBh0e0UvaFxOf_lItWmAFppq5BQICFTy9SpAhjFHOiT0RUfKwgBalOyswpxLcOQR4ztKxRwMW0KSS4ty0fdx-J6E1dW1o_1mmnRhETbyQTFbEk8vXGKoyD6LxpnCIutze_6AbeIMQuYMTeg_1rRmfCqVa8-IglOtS4LeRg68FnAEkT3vDmrzFQGtoL7XsUoN2pkUBA_17A6TJX98IwPo";
const DEFAULT_LOCATION_LABEL = "Times Square, New York";

function formatPrice(priceLevel?: number) {
  if (!Number.isFinite(priceLevel)) return "$$";
  return "$".repeat(Math.max(1, Math.min(4, (priceLevel ?? 1) + 1)));
}

function prettyDistance(index: number) {
  return `${(0.4 + index * 0.3).toFixed(1)} miles`;
}

export default function HomeScreen() {
  const api = useMobileApiClient();
  const router = useRouter();
  const [category, setCategory] = useState<NearbyCategory>("eat");
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION_LABEL);
  const [locationMessage, setLocationMessage] = useState(
    "Using demo nearby results until location access is granted."
  );
  const [locating, setLocating] = useState(false);

  const resolveDeviceLocation = useCallback(
    async (userInitiated: boolean) => {
      setLocating(true);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          setLocationLabel(DEFAULT_LOCATION_LABEL);
          setLocationMessage("Location access is off. Showing demo results near Times Square.");
          return;
        }

        const fallbackPosition = await Location.getLastKnownPositionAsync({
          maxAge: 600_000,
          requiredAccuracy: 500
        });
        const freshPosition =
          userInitiated || !fallbackPosition
            ? await Location.getCurrentPositionAsync({
                accuracy: Location.LocationAccuracy.Balanced
              })
            : fallbackPosition;

        const nextCoords = {
          lat: freshPosition.coords.latitude,
          lng: freshPosition.coords.longitude
        };

        setCoords(nextCoords);

        const [geo] = await Location.reverseGeocodeAsync({
          latitude: nextCoords.lat,
          longitude: nextCoords.lng
        }).catch(() => []);

        const label = [geo?.city || geo?.district || geo?.subregion, geo?.region || geo?.country]
          .filter(Boolean)
          .join(", ");

        setLocationLabel(label || "Current location");
        setLocationMessage("Showing live nearby results from your device.");
      } catch (error) {
        setLocationLabel(DEFAULT_LOCATION_LABEL);
        setLocationMessage("We could not refresh your location. Showing demo nearby results.");
        await trackMobileError(api, error, {
          screen: "nearby",
          action: "resolve_location"
        });
      } finally {
        setLocating(false);
      }
    },
    [api]
  );

  useEffect(() => {
    void resolveDeviceLocation(false);
  }, [resolveDeviceLocation]);

  const nearbyQuery = useQuery({
    queryKey: ["mobile-nearby", coords.lat, coords.lng],
    queryFn: () =>
      api.get<NearbyResponse>(
        `/api/nearby?lat=${coords.lat}&lng=${coords.lng}`,
        { retries: 0 }
      )
  });

  const categoryLabels: Record<NearbyCategory, string> = {
    eat: "Nearby Eat",
    coffee: "Nearby Coffee",
    do: "Nearby Do"
  };

  const list = useMemo(() => {
    const data = nearbyQuery.data;
    if (!data) return [];
    const source = data[category] || [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((place) => {
      const haystack = `${place.name} ${place.address || ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [category, nearbyQuery.data, query]);

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f8f8" }}>
      <Image source={{ uri: MAP_IMAGE }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.6 }} resizeMode="cover" />
      <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.12)" }} />

      <View
        style={{
          paddingTop: 14,
          paddingHorizontal: 14,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#ffffffD9", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="menu" size={20} color="#0f172a" />
        </Pressable>

        <Text style={{ fontSize: 19, fontWeight: "800", color: "#0f172a" }}>Pave</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push("/(tabs)/profile")}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#13b6ec1A", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="person-circle-outline" size={21} color={PRIMARY} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 14 }}>
        <View
          style={{
            height: 48,
            borderRadius: 12,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e2e8f0",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            gap: 8
          }}
        >
          <Ionicons name="search" size={18} color={PRIMARY} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search nearby destinations"
            placeholderTextColor="#94a3b8"
            style={{ flex: 1, color: "#0f172a", fontSize: 15 }}
          />
          <Ionicons name="mic-outline" size={18} color="#94a3b8" />
        </View>
      </View>

      <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", color: "#0f172a" }}>
          Showing spots near {locationLabel}
        </Text>
        <Text style={{ marginTop: 2, fontSize: 12, color: "#64748b", lineHeight: 18 }}>
          {locationMessage}
        </Text>
      </View>

      <View style={{ position: "absolute", top: 136, right: 14, gap: 10 }}>
        <View style={{ borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" }}>
          <Pressable style={{ width: 42, height: 42, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
            <Ionicons name="add" size={20} color="#475569" />
          </Pressable>
          <Pressable style={{ width: 42, height: 42, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="remove" size={20} color="#475569" />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use current location"
          onPress={() => {
            void resolveDeviceLocation(true);
          }}
          disabled={locating}
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: PRIMARY,
            alignItems: "center",
            justifyContent: "center",
            opacity: locating ? 0.7 : 1
          }}
        >
          {locating ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="locate" size={18} color="#fff" />}
        </Pressable>
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          backgroundColor: "#f6f8f8",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          paddingBottom: 86,
          shadowColor: "#0f172a",
          shadowOpacity: 0.14,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
          elevation: 8,
          maxHeight: "72%"
        }}
      >
        <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 6 }}>
          <View style={{ width: 46, height: 5, borderRadius: 3, backgroundColor: "#cbd5e1" }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 8 }}>
          {(["eat", "coffee", "do"] as NearbyCategory[]).map((option) => {
            const active = category === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`Show ${categoryLabels[option]}`}
                onPress={() => setCategory(option)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: active ? PRIMARY : "#fff",
                  borderWidth: 1,
                  borderColor: active ? PRIMARY : "#e2e8f0"
                }}
              >
                <Ionicons
                  name={option === "eat" ? "restaurant-outline" : option === "coffee" ? "cafe-outline" : "compass-outline"}
                  size={16}
                  color={active ? "#fff" : PRIMARY}
                />
                <Text style={{ color: active ? "#fff" : "#334155", fontWeight: active ? "800" : "700", fontSize: 13 }}>
                  {categoryLabels[option]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 6, gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Top recommendations
          </Text>

          {nearbyQuery.isLoading ? <LoadingState label="Finding spots near you..." /> : null}

          {nearbyQuery.isError ? (
            <ErrorState message="Nearby results failed to load." onRetry={() => nearbyQuery.refetch()} />
          ) : null}

          {!nearbyQuery.isLoading && !nearbyQuery.isError && !list.length ? (
            <View style={{ borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>No spots found</Text>
              <Text style={{ marginTop: 4, color: "#64748b" }}>Try another search or switch categories.</Text>
            </View>
          ) : null}

          {!nearbyQuery.isLoading && !nearbyQuery.isError
            ? list.map((place, index) => (
                <Pressable
                  key={place.placeId}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${place.name}`}
                  onPress={() => router.push(`/place/${place.placeId}`)}
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    backgroundColor: "#fff",
                    padding: 10
                  }}
                >
                  {place.photoUrl ? (
                    <Image
                      source={{ uri: place.photoUrl }}
                      style={{ width: 78, height: 78, borderRadius: 12, backgroundColor: "#e2e8f0" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 78, height: 78, borderRadius: 12, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="location-outline" size={22} color={PRIMARY} />
                    </View>
                  )}

                  <View style={{ flex: 1, justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: "#0f172a" }} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <Ionicons name="star" size={13} color="#f59e0b" />
                        <Text style={{ fontWeight: "700", color: "#334155", fontSize: 12 }}>
                          {(place.rating ?? 4.6).toFixed(1)}
                        </Text>
                        <Text style={{ color: "#94a3b8", fontSize: 12 }}>•</Text>
                        <Text style={{ color: "#64748b", fontSize: 12 }}>{prettyDistance(index)}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                      <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#13b6ec1A" }}>
                        <Text style={{ color: PRIMARY, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>
                          {place.openNow ? "Open Now" : "Spot"}
                        </Text>
                      </View>
                      <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#f1f5f9" }}>
                        <Text style={{ color: "#64748b", fontSize: 10, fontWeight: "800" }}>{formatPrice(place.priceLevel)}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            : null}
        </ScrollView>
      </View>
    </View>
  );
}

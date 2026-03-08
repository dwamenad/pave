import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/src/components/ui-states";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";
import { trackMobileEvent } from "@/src/lib/mobile-analytics";

type TripBySlugResponse = {
  trip: {
    id: string;
    slug: string;
    title: string;
    days: Array<{
      id: string;
      dayIndex: number;
      items: Array<{
        id: string;
        placeId?: string | null;
        name: string;
        category: string;
        notes?: string | null;
      }>;
    }>;
  };
  votes: Record<string, { up: number; down: number }>;
};

type TabMode = "itinerary" | "map" | "budget";

const PRIMARY = "#13b6ec";
const BG = "#f6f8f8";
const BORDER = "#e2e8f0";

function formatDayLabel(dayIndex: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayIndex - 1);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

function activityTime(index: number) {
  const hour = 9 + index * 3;
  const normalized = ((hour - 1) % 12) + 1;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${normalized}:00 ${suffix}`;
}

function categoryColor(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("stay")) return { bg: "#dbeafe", text: "#1d4ed8", icon: "bed-outline" as const };
  if (normalized.includes("eat") || normalized.includes("food")) {
    return { bg: "#ffedd5", text: "#c2410c", icon: "restaurant-outline" as const };
  }
  if (normalized.includes("flight") || normalized.includes("transport")) {
    return { bg: "#ede9fe", text: "#6d28d9", icon: "airplane-outline" as const };
  }
  return { bg: "#dcfce7", text: "#166534", icon: "camera-outline" as const };
}

export default function TripDetailScreen() {
  const params = useLocalSearchParams<{ slug: string; group?: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const groupToken = typeof params.group === "string" ? params.group : "";
  const api = useMobileApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabMode>("itinerary");

  const tripQuery = useQuery({
    queryKey: ["mobile-trip", slug],
    enabled: Boolean(slug),
    queryFn: () => api.get<TripBySlugResponse>(`/api/trips/slug/${slug}`)
  });

  const shareMutation = useMutation({
    mutationFn: () => api.post<{ url: string }>(`/api/trips/${tripQuery.data?.trip.id}/share`, { channel: "mobile" }),
    onSuccess: async (payload) => {
      await trackMobileEvent(api, "share_trip", {
        tripId: tripQuery.data?.trip.id,
        channel: "mobile"
      });
      await Share.share({
        message: payload.url,
        url: payload.url
      });
    }
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post<{ url: string }>(`/api/trips/${tripQuery.data?.trip.id}/invite`),
    onSuccess: async (payload) => {
      await Share.share({ message: payload.url, url: payload.url });
    }
  });

  const exportMutation = useMutation({
    mutationFn: () => api.post<{ url: string }>(`/api/trips/${tripQuery.data?.trip.id}/share`, { channel: "mobile_pdf" }),
    onSuccess: async (payload) => {
      await Share.share({
        message: `Open this trip link to export PDF: ${payload.url}`,
        url: payload.url
      });
    }
  });

  const voteMutation = useMutation({
    mutationFn: ({ placeId, voteValue }: { placeId: string; voteValue: 1 | -1 }) =>
      api.post(`/api/trips/${tripQuery.data?.trip.id}/vote`, {
        placeId,
        voteValue,
        groupToken
      }),
    onSuccess: () => {
      if (!slug) return;
      void queryClient.invalidateQueries({ queryKey: ["mobile-trip", slug] });
    }
  });

  const tabItems: Array<{ key: TabMode; label: string }> = [
    { key: "itinerary", label: "Itinerary" },
    { key: "map", label: "Map" },
    { key: "budget", label: "Budget" }
  ];

  const quickActions = [
    {
      icon: "share-social-outline" as const,
      label: "Share link",
      onPress: () => shareMutation.mutate(),
      busy: shareMutation.isPending
    },
    {
      icon: "thumbs-up-outline" as const,
      label: "Voting",
      onPress: () => {
        if (!groupToken) {
          Alert.alert("Voting requires invite", "Open a trip invite link with a group token to vote.");
          return;
        }
        Alert.alert("Voting enabled", "Use activity vote buttons in the timeline.");
      },
      busy: false
    },
    {
      icon: "document-text-outline" as const,
      label: "Export PDF",
      onPress: () => exportMutation.mutate(),
      busy: exportMutation.isPending
    },
    {
      icon: "person-add-outline" as const,
      label: "Invite",
      onPress: () => inviteMutation.mutate(),
      busy: inviteMutation.isPending
    }
  ];

  if (tripQuery.isLoading) return <LoadingState label="Loading itinerary..." />;
  if (tripQuery.isError || !tripQuery.data?.trip) {
    return <ErrorState message="Failed to load itinerary." onRetry={() => tripQuery.refetch()} />;
  }

  const { trip, votes } = tripQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
          backgroundColor: "#fff"
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>

        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }} numberOfLines={1}>
            {trip.title}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 11, color: "#64748b", fontWeight: "600" }}>Pave</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trip menu"
          onPress={() => Alert.alert("Trip options", "More trip options are coming soon.")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#0f172a" />
        </Pressable>
      </View>

      <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: BORDER }}>
        <View style={{ flexDirection: "row", paddingHorizontal: 14, gap: 18 }}>
          {tabItems.map((item) => {
            const active = item.key === tab;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.label} tab`}
                onPress={() => setTab(item.key)}
                style={{
                  borderBottomWidth: 3,
                  borderBottomColor: active ? PRIMARY : "transparent",
                  paddingTop: 14,
                  paddingBottom: 10
                }}
              >
                <Text style={{ fontWeight: "800", color: active ? "#0f172a" : "#64748b", fontSize: 13 }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 16 }}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={{ alignItems: "center", gap: 4, minWidth: 72 }}
              disabled={action.busy}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#13b6ec1A"
                }}
              >
                <Ionicons name={action.icon} size={19} color={PRIMARY} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#0f172a" }}>
                {action.busy ? "..." : action.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 110, gap: 18 }}>
        {tab !== "itinerary" ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 14
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
              {tab === "map" ? "Map preview" : "Budget preview"}
            </Text>
            <Text style={{ marginTop: 6, color: "#64748b" }}>
              This section is visual-first on mobile beta. Your itinerary data stays fully synced.
            </Text>
          </View>
        ) : null}

        {trip.days.map((day) => (
          <View key={day.id}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                backgroundColor: BG,
                paddingVertical: 2
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: day.dayIndex === 1 ? PRIMARY : "#e2e8f0"
                }}
              >
                <Text style={{ color: day.dayIndex === 1 ? "#fff" : "#334155", fontWeight: "800" }}>
                  {day.dayIndex}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Day {day.dayIndex}</Text>
                <Text style={{ fontSize: 12, color: "#64748b" }}>{formatDayLabel(day.dayIndex)}</Text>
              </View>
            </View>

            <View style={{ paddingLeft: 24, gap: 10 }}>
              <View
                style={{
                  position: "absolute",
                  left: 17,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: "#e2e8f0"
                }}
              />

              {day.items.map((item, index) => {
                const color = categoryColor(item.category);
                const placeVotes = item.placeId ? votes[item.placeId] : undefined;
                return (
                  <View
                    key={item.id}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#f1f5f9",
                      backgroundColor: "#fff",
                      padding: 12,
                      position: "relative"
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        left: -26,
                        top: 16,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#fff",
                        borderWidth: 2,
                        borderColor: PRIMARY
                      }}
                    />

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ flexDirection: "row", flex: 1, gap: 10 }}>
                        <View
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 10,
                            backgroundColor: color.bg,
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <Ionicons name={color.icon} size={20} color={color.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Text style={{ fontSize: 10, fontWeight: "800", color: PRIMARY, textTransform: "uppercase" }}>
                              {activityTime(index)}
                            </Text>
                            <View style={{ borderRadius: 6, backgroundColor: color.bg, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 9, color: color.text, fontWeight: "800", textTransform: "uppercase" }}>
                                {item.category}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "800", color: "#0f172a" }}>{item.name}</Text>
                          {item.notes ? (
                            <Text style={{ marginTop: 2, fontSize: 12, color: "#64748b" }} numberOfLines={2}>
                              {item.notes}
                            </Text>
                          ) : null}

                          {item.placeId && groupToken ? (
                            <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Upvote ${item.name}`}
                                onPress={() => voteMutation.mutate({ placeId: item.placeId!, voteValue: 1 })}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 4,
                                  borderRadius: 999,
                                  borderWidth: 1,
                                  borderColor: "#bae6fd",
                                  paddingHorizontal: 8,
                                  paddingVertical: 4
                                }}
                              >
                                <Ionicons name="thumbs-up-outline" size={13} color="#0284c7" />
                                <Text style={{ color: "#0284c7", fontWeight: "700", fontSize: 11 }}>{placeVotes?.up ?? 0}</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Downvote ${item.name}`}
                                onPress={() => voteMutation.mutate({ placeId: item.placeId!, voteValue: -1 })}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 4,
                                  borderRadius: 999,
                                  borderWidth: 1,
                                  borderColor: "#fecaca",
                                  paddingHorizontal: 8,
                                  paddingVertical: 4
                                }}
                              >
                                <Ionicons name="thumbs-down-outline" size={13} color="#b91c1c" />
                                <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 11 }}>{placeVotes?.down ?? 0}</Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <Ionicons name="reorder-three-outline" size={18} color="#94a3b8" />
                    </View>
                  </View>
                );
              })}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add an activity to day ${day.dayIndex}`}
                onPress={() => router.push("/(tabs)/create")}
                style={{
                  borderRadius: 12,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#cbd5e1",
                  paddingVertical: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color="#64748b" />
                <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
                  Add Activity
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a new trip"
        onPress={() => router.push("/(tabs)/create")}
        style={{
          position: "absolute",
          right: 16,
          bottom: 90,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: PRIMARY,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: PRIMARY,
          shadowOpacity: 0.32,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

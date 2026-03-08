import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";
import { EmptyState, ErrorState } from "@/src/components/ui-states";
import { trackMobileError, trackMobileEvent } from "@/src/lib/mobile-analytics";

type ParseResponse = {
  hints: string[];
  resolved?: { placeId: string; text: string };
  ambiguous: Array<{ placeId: string; text: string }>;
  metadata: Array<{ title?: string; url: string }>;
  error?: string;
};

type PlaceDetailsResponse = {
  place?: {
    placeId: string;
    name: string;
    lat: number;
    lng: number;
  };
};

type TripCreateResponse = {
  trip?: {
    id: string;
    slug: string;
  };
  error?: string;
};

type PostCreateResponse = {
  post?: {
    id: string;
  };
  error?: string;
};

export default function CreateScreen() {
  const api = useMobileApiClient();
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [linksInput, setLinksInput] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; text: string }>>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [status, setStatus] = useState<string>("");
  const [publish, setPublish] = useState(true);
  const [visibility, setVisibility] = useState<"PUBLIC" | "UNLISTED">("PUBLIC");
  const [error, setError] = useState<string | null>(null);

  const parsedLinks = useMemo(
    () =>
      linksInput
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 5),
    [linksInput]
  );

  const parseMutation = useMutation({
    mutationFn: () => api.post<ParseResponse>("/api/social/parse", { input: caption, links: parsedLinks }),
    onSuccess: (data) => {
      setError(null);
      setHints(data.hints || []);
      if (data.resolved) {
        setSuggestions([data.resolved]);
        setSelectedPlaceId(data.resolved.placeId);
        setStatus(`Resolved: ${data.resolved.text}`);
        return;
      }

      setSuggestions(data.ambiguous || []);
      setSelectedPlaceId(data.ambiguous?.[0]?.placeId || "");
      setStatus(data.ambiguous?.length ? "Select a destination suggestion." : "No clear location found.");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to parse social input");
      void trackMobileError(api, err, { screen: "create", action: "parse" });
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlaceId) {
        throw new Error("Choose a location first.");
      }

      setStatus("Loading place details...");
      const details = await api.get<PlaceDetailsResponse>(`/api/places/details?placeId=${encodeURIComponent(selectedPlaceId)}`);
      if (!details.place) {
        throw new Error("Place details unavailable");
      }

      setStatus("Generating trip...");
      const tripData = await api.post<TripCreateResponse>("/api/trips", {
        placeId: selectedPlaceId,
        title: `${details.place.name} Social Plan`,
        centerLat: details.place.lat,
        centerLng: details.place.lng,
        days: 2,
        budget: "mid",
        preferences: {
          budget: "mid",
          days: 2,
          pace: "balanced",
          vibeTags: ["food", "culture"],
          dietary: []
        }
      });

      if (!tripData.trip?.id || !tripData.trip?.slug) {
        throw new Error(tripData.error || "Trip creation failed");
      }

      if (!publish) {
        return {
          tripId: tripData.trip.id,
          tripSlug: tripData.trip.slug,
          postId: null,
          destinationLabel: details.place.name
        };
      }

      setStatus("Publishing post...");
      const postData = await api.post<PostCreateResponse>("/api/posts", {
        tripId: tripData.trip.id,
        caption,
        mediaUrl: parsedLinks[0] || null,
        visibility,
        destinationLabel: details.place.name,
        tags: ["mobile"],
        links: parsedLinks
      });

      if (!postData.post?.id) {
        throw new Error(postData.error || "Post publish failed");
      }

      await trackMobileEvent(api, "publish_post", {
        tripId: tripData.trip.id,
        postId: postData.post.id,
        visibility
      });

      return {
        tripId: tripData.trip.id,
        tripSlug: tripData.trip.slug,
        postId: postData.post.id,
        destinationLabel: details.place.name
      };
    },
    onSuccess: (result) => {
      setError(null);
      setStatus(result.postId ? "Trip created and published." : "Trip created.");
      if (result.postId) {
        router.push(`/post/${result.postId}`);
      } else {
        router.push(`/trip/${result.tripSlug}`);
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create itinerary");
      void trackMobileError(api, err, { screen: "create", action: "build" });
    }
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc" }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 14 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>Create from Social</Text>
        <Text style={{ marginTop: 4, color: "#64748b" }}>
          Parse links and caption, then generate and publish in one flow.
        </Text>

        <Text style={{ marginTop: 10, color: "#334155", fontWeight: "700" }}>Caption</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Weekend in Kyoto with coffee and temples"
          multiline
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            minHeight: 88,
            textAlignVertical: "top"
          }}
        />

        <Text style={{ marginTop: 10, color: "#334155", fontWeight: "700" }}>Social links (up to 5)</Text>
        <TextInput
          value={linksInput}
          onChangeText={setLinksInput}
          placeholder="https://instagram.com/... (one per line)"
          multiline
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            minHeight: 88,
            textAlignVertical: "top"
          }}
        />

        <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => parseMutation.mutate()}
            style={{ borderRadius: 10, borderWidth: 1, borderColor: "#0ea5e9", paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Text style={{ color: "#0369a1", fontWeight: "700" }}>
              {parseMutation.isPending ? "Parsing..." : "Parse Location"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => createMutation.mutate()}
            style={{ borderRadius: 10, backgroundColor: "#0ea5e9", paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {createMutation.isPending ? "Building..." : "Generate + Publish"}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setPublish((value) => !value)}
            style={{ borderRadius: 999, backgroundColor: publish ? "#0ea5e9" : "#e2e8f0", paddingHorizontal: 10, paddingVertical: 7 }}
          >
            <Text style={{ color: publish ? "#fff" : "#334155", fontWeight: "700" }}>
              {publish ? "Publish: ON" : "Publish: OFF"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setVisibility((value) => (value === "PUBLIC" ? "UNLISTED" : "PUBLIC"))}
            style={{ borderRadius: 999, backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 7 }}
          >
            <Text style={{ color: "#334155", fontWeight: "700" }}>Visibility: {visibility}</Text>
          </Pressable>
        </View>
      </View>

      {hints.length ? (
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 14 }}>
          <Text style={{ fontWeight: "800", color: "#0f172a" }}>Detected hints</Text>
          <Text style={{ marginTop: 6, color: "#475569" }}>{hints.join(", ")}</Text>
        </View>
      ) : (
        <EmptyState title="No hints yet" subtitle="Parse your caption and links to detect destination hints." />
      )}

      {suggestions.length ? (
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 14, gap: 8 }}>
          <Text style={{ fontWeight: "800", color: "#0f172a" }}>Suggestions</Text>
          {suggestions.map((suggestion) => {
            const active = selectedPlaceId === suggestion.placeId;
            return (
              <Pressable
                key={suggestion.placeId}
                onPress={() => setSelectedPlaceId(suggestion.placeId)}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? "#0ea5e9" : "#e2e8f0",
                  backgroundColor: active ? "#f0f9ff" : "#fff",
                  paddingHorizontal: 10,
                  paddingVertical: 10
                }}
              >
                <Text style={{ color: "#334155", fontWeight: "700" }}>{suggestion.text}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
      {status ? (
        <View style={{ borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 10 }}>
          <Text style={{ color: "#334155" }}>{status}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

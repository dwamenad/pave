/* eslint-disable jsx-a11y/alt-text */
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MobileMeResponse, MobileProfileResponse } from "@pave/contracts";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui-states";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";
import { useMobileAuth } from "@/src/auth/mobile-auth-context";
import { trackMobileError, trackMobileEvent } from "@/src/lib/mobile-analytics";
import { resolveApiBaseUrl } from "@/src/lib/api-client";

type ProfileScreenProps = {
  initialUsername?: string;
};

const PRIMARY = "#13b6ec";

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}

export function ProfileScreen({ initialUsername }: ProfileScreenProps) {
  const api = useMobileApiClient();
  const auth = useMobileAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"posts" | "saved">("posts");

  const meQuery = useQuery({
    queryKey: ["mobile-me"],
    queryFn: () => api.get<MobileMeResponse>("/api/mobile/me")
  });

  const username = initialUsername || meQuery.data?.user.username || null;
  const isMe = Boolean(username && meQuery.data?.user.username === username);

  const profileQuery = useQuery({
    queryKey: ["mobile-profile", username, tab],
    enabled: Boolean(username),
    queryFn: () => api.get<MobileProfileResponse>(`/api/profile/${username}?tab=${tab}`)
  });

  const followMutation = useMutation({
    mutationFn: () => {
      const targetUserId = profileQuery.data?.user.id;
      if (!targetUserId) throw new Error("Missing target user");
      return profileQuery.data?.viewer.follows
        ? api.delete<{ following: boolean }>(`/api/users/${targetUserId}/follow`)
        : api.post<{ following: boolean }>(`/api/users/${targetUserId}/follow`);
    },
    onSuccess: (payload) => {
      if (!username) return;
      if (payload.following) {
        void trackMobileEvent(api, "follow_user", { targetUsername: username });
      }

      queryClient.setQueryData(["mobile-profile", username, tab], (existing: MobileProfileResponse | undefined) => {
        if (!existing) return existing;
        return {
          ...existing,
          viewer: {
            ...existing.viewer,
            follows: payload.following
          }
        };
      });
    }
  });

  const profile = profileQuery.data;
  const items = useMemo(() => profile?.items ?? [], [profile?.items]);
  const trustBaseUrl = resolveApiBaseUrl();

  async function openTrustPath(path: string) {
    await Linking.openURL(`${trustBaseUrl}${path}`);
  }

  useEffect(() => {
    if (!meQuery.error && !profileQuery.error) return;
    void trackMobileError(api, meQuery.error || profileQuery.error, {
      screen: "profile",
      username,
      tab
    });
  }, [api, meQuery.error, profileQuery.error, tab, username]);

  if (meQuery.isLoading || (username && profileQuery.isLoading)) {
    return <LoadingState label="Loading profile..." />;
  }

  if (meQuery.isError || (username && profileQuery.isError)) {
    return <ErrorState message="Failed to load profile." onRetry={() => profileQuery.refetch()} />;
  }

  if (!username || !profile) {
    return <EmptyState title="Profile unavailable" subtitle="Complete sign-in and try again." />;
  }

  const displayName = profile.user.name || profile.user.username || "Traveler";
  const avatarUri = profile.user.image || meQuery.data?.user.image || null;
  const canGoBack = Boolean(initialUsername);

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f8f8" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: "#d6ecf3",
          backgroundColor: "#f6f8f8"
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => {
            if (canGoBack) router.back();
          }}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", opacity: canGoBack ? 1 : 0.2 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>

        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Pave</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isMe ? "Settings" : "More options"}
          onPress={() => {
            if (isMe) {
              Alert.alert("Trust & support", "Open the latest Pave support and policy pages.", [
                { text: "Support", onPress: () => void openTrustPath("/support") },
                { text: "Privacy", onPress: () => void openTrustPath("/privacy") },
                { text: "Terms", onPress: () => void openTrustPath("/terms") },
                { text: "Cancel", style: "cancel" }
              ]);
              return;
            }
          }}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name={isMe ? "settings-outline" : "ellipsis-horizontal"} size={18} color="#0f172a" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 92 }}>
        <View style={{ alignItems: "center", paddingHorizontal: 14, paddingTop: 14 }}>
          <View style={{ position: "relative" }}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: "#13b6ec33" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  borderWidth: 4,
                  borderColor: "#13b6ec33",
                  backgroundColor: "#dbeafe",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Ionicons name="person-outline" size={38} color={PRIMARY} />
              </View>
            )}

            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: PRIMARY,
                borderWidth: 2,
                borderColor: "#f6f8f8",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          </View>

          <Text style={{ marginTop: 12, fontSize: 26, fontWeight: "800", color: "#0f172a", textAlign: "center" }}>
            {displayName}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 18, paddingHorizontal: 14 }}>
            {profile.user.bio || "Exploring the world one click at a time with Pave."}
          </Text>

          {isMe ? (
            <View style={{ flexDirection: "row", width: "100%", gap: 8, marginTop: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#13b6ec1A",
                  borderWidth: 1,
                  borderColor: "#13b6ec33"
                }}
              >
                <Text style={{ color: PRIMARY, fontWeight: "800", fontSize: 13 }}>Edit Profile</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share profile"
                onPress={() =>
                  Share.share({
                    message: `${displayName} on Pave - ${process.env.EXPO_PUBLIC_API_BASE_URL || "https://pave"}/profile/${profile.user.username || "traveler"}`
                  })
                }
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: PRIMARY
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>Share</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={profile.viewer.follows ? "Unfollow" : "Follow"}
              onPress={() => followMutation.mutate()}
              style={{
                marginTop: 12,
                minWidth: 150,
                height: 42,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: profile.viewer.follows ? "#e2e8f0" : PRIMARY
              }}
            >
              <Text style={{ color: profile.viewer.follows ? "#334155" : "#fff", fontWeight: "800" }}>
                {profile.viewer.follows ? "Following" : "Follow"}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 14, marginTop: 12 }}>
          <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#d6ecf3", backgroundColor: "#ffffffA6", paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a" }}>{formatCompact(profile.user.stats.posts)}</Text>
            <Text style={{ marginTop: 2, fontSize: 10, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Posts
            </Text>
          </View>
          <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#d6ecf3", backgroundColor: "#ffffffA6", paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a" }}>{formatCompact(profile.user.stats.savedPosts)}</Text>
            <Text style={{ marginTop: 2, fontSize: 10, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Saved
            </Text>
          </View>
          <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#d6ecf3", backgroundColor: "#ffffffA6", paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a" }}>{formatCompact(profile.user.stats.totalPlannedDays)}</Text>
            <Text style={{ marginTop: 2, fontSize: 10, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Days
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 14, borderBottomWidth: 1, borderBottomColor: "#d6ecf3" }}>
          <View style={{ flexDirection: "row", paddingHorizontal: 14 }}>
            {([
              { key: "posts", label: "Posts", icon: "grid-outline" as const },
              { key: "saved", label: "Saved", icon: "bookmark-outline" as const }
            ] as const).map((option) => {
              const active = option.key === tab;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${option.label}`}
                  onPress={() => setTab(option.key)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    borderBottomWidth: 2,
                    borderBottomColor: active ? PRIMARY : "transparent",
                    paddingVertical: 9,
                    gap: 2
                  }}
                >
                  <Ionicons name={option.icon} size={16} color={active ? PRIMARY : "#94a3b8"} />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: active ? PRIMARY : "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, paddingHorizontal: 14, paddingTop: 14 }}>
          {items.length
            ? items.map((post) => (
                <Pressable
                  key={post.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${post.destinationLabel || post.trip.title}`}
                  onPress={() => router.push(`/post/${post.id}`)}
                  style={{ width: "48%", gap: 6 }}
                >
                  <View style={{ aspectRatio: 4 / 5, borderRadius: 12, overflow: "hidden", position: "relative", backgroundColor: "#dbeafe" }}>
                    {post.mediaUrl ? (
                      <Image source={{ uri: post.mediaUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="image-outline" size={22} color={PRIMARY} />
                      </View>
                    )}

                    <View
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        backgroundColor: "rgba(15,23,42,0.45)",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 2
                      }}
                    >
                      <Ionicons name="star" size={10} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                        {(4 + (post.counts.likes % 10) / 10).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#0f172a" }} numberOfLines={1}>
                    {post.destinationLabel || post.trip.title}
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="location-outline" size={11} color="#94a3b8" />
                    <Text style={{ color: "#64748b", fontSize: 10 }} numberOfLines={1}>
                      {post.destinationLabel || "Pave itinerary"}
                    </Text>
                  </View>
                </Pressable>
              ))
            : null}
        </View>

        {!items.length ? (
          <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
            <EmptyState
              title={tab === "saved" ? "No saved posts yet" : "No posts yet"}
              subtitle={
                tab === "saved"
                  ? "Save trips from the feed to view them here."
                  : "Create and publish to populate this profile."
              }
            />
          </View>
        ) : null}

        {isMe ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => auth.signOut()}
            style={{
              marginHorizontal: 14,
              marginTop: 16,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#fecaca",
              backgroundColor: "#fff",
              paddingHorizontal: 12,
              paddingVertical: 11,
              alignItems: "center"
            }}
          >
            <Text style={{ color: "#b91c1c", fontWeight: "800" }}>Sign out</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

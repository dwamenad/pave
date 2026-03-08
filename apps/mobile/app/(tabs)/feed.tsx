import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData
} from "@tanstack/react-query";
import type {
  MobileFeedResponse,
  MobileFeedSource,
  MobilePostSummary,
  MobileToggleLikeResponse,
  MobileToggleSaveResponse
} from "@pave/contracts";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui-states";
import { mergeUniqueFeedItems } from "@/src/lib/feed-pagination";
import { trackMobileError, trackMobileEvent } from "@/src/lib/mobile-analytics";

const SOURCES: Array<{ key: MobileFeedSource; label: string }> = [
  { key: "FOR_YOU", label: "For You" },
  { key: "FOLLOWING", label: "Following" },
  { key: "TRENDING", label: "Trending" }
];

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}

export default function FeedScreen() {
  const api = useMobileApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [source, setSource] = useState<MobileFeedSource>("FOR_YOU");

  const feedQuery = useInfiniteQuery({
    queryKey: ["mobile-feed", source],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const cursor = typeof pageParam === "string" ? `&cursor=${encodeURIComponent(pageParam)}` : "";
      return api.get<MobileFeedResponse>(`/api/feed?source=${source}${cursor}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null
  });

  const items = useMemo(
    () => mergeUniqueFeedItems<MobilePostSummary>(feedQuery.data?.pages ?? []),
    [feedQuery.data?.pages]
  );

  useEffect(() => {
    if (!feedQuery.isSuccess) return;
    void trackMobileEvent(api, "view_feed", {
      source,
      itemCount: items.length
    });
  }, [api, feedQuery.isSuccess, items.length, source]);

  useEffect(() => {
    if (!feedQuery.error) return;
    void trackMobileError(api, feedQuery.error, {
      screen: "feed",
      source
    });
  }, [api, feedQuery.error, source]);

  function updateFeedItem(
    postId: string,
    updater: (item: MobilePostSummary) => MobilePostSummary
  ) {
    queryClient.setQueriesData(
      { queryKey: ["mobile-feed"] },
      (existing: InfiniteData<MobileFeedResponse> | undefined) => {
        if (!existing) return existing;
        return {
          ...existing,
          pages: existing.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === postId ? updater(item) : item))
          }))
        };
      }
    );
  }

  const likeMutation = useMutation({
    mutationFn: (postId: string) => api.post<MobileToggleLikeResponse>(`/api/posts/${postId}/like`),
    onSuccess: (result, postId) => {
      updateFeedItem(postId, (item) => ({
        ...item,
        counts: {
          ...item.counts,
          likes: result.liked ? item.counts.likes + 1 : Math.max(0, item.counts.likes - 1)
        }
      }));
    }
  });

  const saveMutation = useMutation({
    mutationFn: (postId: string) => api.post<MobileToggleSaveResponse>(`/api/posts/${postId}/save`),
    onSuccess: (result, postId) => {
      updateFeedItem(postId, (item) => ({
        ...item,
        counts: {
          ...item.counts,
          saves: result.saved ? item.counts.saves + 1 : Math.max(0, item.counts.saves - 1)
        }
      }));

      if (result.saved) {
        void trackMobileEvent(api, "save_post", { postId });
      }
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>Social Feed</Text>
        <Text style={{ marginTop: 4, color: "#64748b" }}>
          Discover itineraries and remix what fits your style.
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          {SOURCES.map((option) => {
            const active = option.key === source;
            return (
              <Pressable
                key={option.key}
                onPress={() => setSource(option.key)}
                style={{
                  borderRadius: 999,
                  backgroundColor: active ? "#0ea5e9" : "#e2e8f0",
                  paddingHorizontal: 12,
                  paddingVertical: 8
                }}
              >
                <Text style={{ color: active ? "#fff" : "#334155", fontWeight: "700", fontSize: 12 }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {feedQuery.isLoading ? <LoadingState label="Loading feed..." /> : null}
      {feedQuery.isError ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorState message="Failed to load feed." onRetry={() => feedQuery.refetch()} />
        </View>
      ) : null}

      {!feedQuery.isLoading && !feedQuery.isError ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 10 }}
          refreshControl={<RefreshControl refreshing={feedQuery.isRefetching} onRefresh={() => feedQuery.refetch()} />}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
              void feedQuery.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            <EmptyState title="No posts yet" subtitle="Publish a trip to start your mobile feed." />
          }
          ListFooterComponent={
            feedQuery.isFetchingNextPage ? <LoadingState label="Loading more..." /> : null
          }
          renderItem={({ item }) => (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                backgroundColor: "#fff",
                overflow: "hidden"
              }}
            >
              {item.mediaUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image source={{ uri: item.mediaUrl }} style={{ width: "100%", height: 180 }} resizeMode="cover" />
              ) : (
                <View style={{ height: 160, backgroundColor: "#e0f2fe", justifyContent: "center", padding: 14 }}>
                  <Text style={{ fontWeight: "700", color: "#0369a1" }}>
                    {item.destinationLabel || item.trip.title}
                  </Text>
                </View>
              )}

              <View style={{ padding: 12, gap: 8 }}>
                <Pressable onPress={() => router.push(`/post/${item.id}`)}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a" }}>
                    {item.destinationLabel || item.trip.title}
                  </Text>
                  <Text style={{ marginTop: 4, color: "#64748b" }} numberOfLines={2}>
                    {item.caption}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (item.author.username) {
                      router.push(`/profile/${item.author.username}`);
                    }
                  }}
                >
                  <Text style={{ color: "#0369a1", fontWeight: "700" }}>
                    @{item.author.username || item.author.name || "traveler"}
                  </Text>
                </Pressable>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable
                      onPress={() => likeMutation.mutate(item.id)}
                      style={{ borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 8 }}
                    >
                      <Text style={{ fontWeight: "700", color: "#334155" }}>Like {formatCount(item.counts.likes)}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => saveMutation.mutate(item.id)}
                      style={{ borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 8 }}
                    >
                      <Text style={{ fontWeight: "700", color: "#334155" }}>Save {formatCount(item.counts.saves)}</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => router.push(`/trip/${item.trip.slug}`)}
                    style={{ borderRadius: 10, backgroundColor: "#0ea5e9", paddingHorizontal: 12, paddingVertical: 9 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Remix</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      ) : null}
    </View>
  );
}

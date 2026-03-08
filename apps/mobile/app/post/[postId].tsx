import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MobileCommentCreateResponse,
  MobilePostDetailResponse
} from "@pave/contracts";
import { ErrorState, LoadingState } from "@/src/components/ui-states";
import { useMobileApiClient } from "@/src/lib/use-mobile-api-client";
import { trackMobileError, trackMobileEvent } from "@/src/lib/mobile-analytics";

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ postId: string }>();
  const postId = params.postId;
  const router = useRouter();
  const api = useMobileApiClient();
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");

  const postQuery = useQuery({
    queryKey: ["mobile-post", postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const response = await api.get<MobilePostDetailResponse>(`/api/posts/${postId}`);
      await trackMobileEvent(api, "view_post", { postId });
      return response;
    }
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) =>
      api.post<MobileCommentCreateResponse>(`/api/posts/${postId}/comments`, { body }),
    onSuccess: (payload) => {
      setCommentBody("");
      void trackMobileEvent(api, "comment_post", { postId, commentId: payload.comment.id });
      queryClient.setQueryData(["mobile-post", postId], (existing: MobilePostDetailResponse | undefined) => {
        if (!existing) return existing;
        return {
          ...existing,
          post: {
            ...existing.post,
            comments: [payload.comment, ...existing.post.comments],
            counts: {
              ...existing.post.counts,
              comments: existing.post.counts.comments + 1
            }
          }
        };
      });
    }
  });

  const remixMutation = useMutation({
    mutationFn: () => api.post<{ url?: string }>(`/api/trips/${postQuery.data?.post.trip.id}/remix`),
    onSuccess: (payload) => {
      void trackMobileEvent(api, "remix_trip", {
        postId,
        tripId: postQuery.data?.post.trip.id
      });
      if (payload.url) {
        router.push(payload.url);
      }
    }
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/reports`, {
        targetType: "POST",
        targetId: postId,
        reason: "Reported from mobile"
      })
  });

  const post = useMemo(() => postQuery.data?.post ?? null, [postQuery.data?.post]);

  useEffect(() => {
    if (!postQuery.error) return;
    void trackMobileError(api, postQuery.error, {
      screen: "post_detail",
      postId
    });
  }, [api, postId, postQuery.error]);

  if (postQuery.isLoading) {
    return <LoadingState label="Loading post..." />;
  }

  if (postQuery.isError || !post) {
    return <ErrorState message="Failed to load post." onRetry={() => postQuery.refetch()} />;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc" }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#0284c7", fontWeight: "700" }}>Back</Text>
      </Pressable>

      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", overflow: "hidden" }}>
        {post.mediaUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image source={{ uri: post.mediaUrl }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
        ) : null}
        <View style={{ padding: 14, gap: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>{post.destinationLabel || post.trip.title}</Text>
          <Text style={{ color: "#475569" }}>{post.caption}</Text>
          <Pressable
            onPress={() => {
              if (post.author.username) {
                router.push(`/profile/${post.author.username}`);
              }
            }}
          >
            <Text style={{ fontWeight: "700", color: "#0369a1" }}>
              @{post.author.username || post.author.name || "traveler"}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => remixMutation.mutate()}
              style={{ borderRadius: 10, backgroundColor: "#0ea5e9", paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{remixMutation.isPending ? "Remixing..." : "Remix Trip"}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/trip/${post.trip.slug}`)}
              style={{ borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Text style={{ color: "#334155", fontWeight: "700" }}>View Trip</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert("Report post", "Are you sure you want to report this post?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Report", style: "destructive", onPress: () => reportMutation.mutate() }
                ])
              }
              style={{ borderRadius: 10, borderWidth: 1, borderColor: "#fecaca", paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Report</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 14 }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
          Comments ({post.counts.comments})
        </Text>

        <View style={{ marginTop: 10, flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            value={commentBody}
            onChangeText={setCommentBody}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#fff"
            }}
          />
          <Pressable
            disabled={!commentBody.trim() || commentMutation.isPending}
            onPress={() => commentMutation.mutate(commentBody.trim())}
            style={{
              borderRadius: 10,
              backgroundColor: !commentBody.trim() || commentMutation.isPending ? "#7dd3fc" : "#0ea5e9",
              paddingHorizontal: 12,
              paddingVertical: 10
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 12, gap: 8 }}>
          {post.comments.map((comment) => (
            <View key={comment.id} style={{ borderRadius: 10, backgroundColor: "#f8fafc", padding: 10 }}>
              <Text style={{ fontWeight: "700", color: "#334155" }}>
                @{comment.author.username || comment.author.name || "traveler"}
              </Text>
              <Text style={{ marginTop: 3, color: "#475569" }}>{comment.body}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

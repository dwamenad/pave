"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FollowButton({ userId, initiallyFollowing }: { userId: string; initiallyFollowing: boolean }) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, setPending] = useState(false);

  async function toggleFollow() {
    if (pending) return;
    setPending(true);

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: following ? "DELETE" : "POST"
      });

      if (!response.ok) return;
      const data = (await response.json()) as { following?: boolean };
      setFollowing(Boolean(data.following));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button disabled={pending} onClick={toggleFollow} variant={following ? "outline" : "default"}>
      {pending ? "Updating..." : following ? "Following" : "Follow"}
    </Button>
  );
}

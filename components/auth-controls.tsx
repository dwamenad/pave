"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-xs text-muted-foreground">Loading session...</span>;
  }

  if (!session?.user) {
    return (
      <Button type="button" variant="outline" onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{session.user.name || session.user.email}</span>
      <Link href="/create" className="rounded border px-3 py-2 text-xs hover:bg-muted">Create</Link>
      <Link href="/feed" className="rounded border px-3 py-2 text-xs hover:bg-muted">Feed</Link>
      <Button type="button" variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
    </div>
  );
}

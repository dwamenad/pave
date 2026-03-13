"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Bell, LogOut, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2" aria-hidden="true">
        <div className="hidden h-9 w-24 rounded-lg border border-border bg-card/70 md:block" />
        <div className="h-9 w-28 rounded-lg border border-border bg-card/70" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Button type="button" className="h-9 rounded-lg px-4 text-sm font-semibold" onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user.image ? (
        <img
          alt="Profile"
          className="hidden h-8 w-8 rounded-full border border-border object-cover sm:block"
          src={session.user.image}
        />
      ) : null}
      <span className="hidden max-w-36 truncate text-xs text-muted-foreground md:block">
        {session.user.name || session.user.email}
      </span>
      <Link
        href="/create"
        className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        <PlusSquare className="h-4 w-4" />
        Create
      </Link>
      <Link href="/feed" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted">
        Feed
      </Link>
      <Link href="/notifications" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted" title="Notifications">
        <Bell className="h-4 w-4" />
      </Link>
      <Button type="button" className="h-9 w-9 rounded-lg p-0" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

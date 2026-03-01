"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-xs text-muted-foreground">Loading...</span>;
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
      <Link href="/feed" className="inline-flex h-9 items-center rounded-lg border bg-white px-3 text-xs font-semibold hover:bg-muted">
        Feed
      </Link>
      <Button type="button" className="h-9 w-9 rounded-lg p-0" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

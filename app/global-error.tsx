"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

function reportGlobalError(error: Error) {
  const body = JSON.stringify({
    events: [
      {
        name: "web_runtime_error",
        props: {
          route: "global_error",
          subsystem: "web",
          signedIn: null,
          kind: "global_error",
          message: error.message.slice(0, 300)
        }
      }
    ]
  });

  fetch("/api/events/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => undefined);
}

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportGlobalError(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something broke in the app shell.</h1>
            <p className="text-sm text-muted-foreground">
              We logged the failure and kept the message safe. Retry the route, and if it keeps happening,
              use the support link in the header.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => reset()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}

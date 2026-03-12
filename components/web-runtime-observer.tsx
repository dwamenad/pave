"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

function sendRuntimeEvent(payload: Record<string, unknown>) {
  const body = JSON.stringify({
    events: [
      {
        name: "web_runtime_error",
        props: payload
      }
    ]
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/events/batch", blob);
    return;
  }

  fetch("/api/events/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => undefined);
}

export function WebRuntimeObserver() {
  const pathname = usePathname();
  const { status } = useSession();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    function track(kind: "error" | "unhandledrejection", message: string) {
      const signature = `${kind}:${pathname}:${message.slice(0, 180)}`;
      if (seen.current.has(signature)) return;
      seen.current.add(signature);

      sendRuntimeEvent({
        route: pathname,
        subsystem: "web",
        signedIn: status === "authenticated",
        kind,
        message: message.slice(0, 300)
      });
    }

    function onError(event: ErrorEvent) {
      track("error", event.message || "Unhandled client error");
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason instanceof Error
            ? event.reason.message
            : "Unhandled promise rejection";
      track("unhandledrejection", reason);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname, status]);

  return null;
}

"use client";

import { useState } from "react";
import { Copy, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

async function copyText(value: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Ignore clipboard failures.
  }
}

export function ShareControls({ tripId }: { tripId: string }) {
  const [publicUrl, setPublicUrl] = useState("");
  const [groupUrl, setGroupUrl] = useState("");

  async function makePublicLink() {
    const response = await fetch(`/api/trips/${tripId}/share`, { method: "POST" });
    const data = (await response.json()) as { url?: string };
    setPublicUrl(data.url || "");
  }

  async function makeGroupLink() {
    const response = await fetch(`/api/trips/${tripId}/invite`, { method: "POST" });
    const data = (await response.json()) as { url?: string };
    setGroupUrl(data.url || "");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={makePublicLink} className="rounded-lg">
          <Link2 className="mr-1 h-3.5 w-3.5" />
          Generate public link
        </Button>
        <Button variant="outline" onClick={makeGroupLink} className="rounded-lg">
          <Users className="mr-1 h-3.5 w-3.5" />
          Generate group link
        </Button>
      </div>

      {publicUrl ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <p className="font-semibold text-slate-700">Public</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="flex-1 break-all text-slate-500">{publicUrl}</p>
            <button className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-primary" onClick={() => copyText(publicUrl)} type="button">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {groupUrl ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <p className="font-semibold text-slate-700">Group voting</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="flex-1 break-all text-slate-500">{groupUrl}</p>
            <button className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-primary" onClick={() => copyText(groupUrl)} type="button">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

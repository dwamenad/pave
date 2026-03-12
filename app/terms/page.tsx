import { FileText, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Terms</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          These terms summarize the current product boundaries for contributors, beta users, and early testers. They are
          intentionally honest about what Pave does today and what is still out of scope.
        </p>
      </section>

      <section className="surface-card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Acceptable use</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Use Pave to plan, publish, remix, and discuss trips in good faith.</li>
            <li>Do not upload or link abusive, illegal, or deceptive content.</li>
            <li>Use the in-product report flow when content or behavior crosses the line.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Current platform boundaries</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Pave does not currently provide a native media upload pipeline. Post media must be an external <code>http(s)</code> URL.</li>
            <li>Feed ranking is heuristic and feature-driven today, not a learned ML-serving stack.</li>
            <li>Comments and group voting are available, but they are not realtime collaboration systems.</li>
            <li>The mobile app is a beta client and not yet a separately scaled public app-store release system.</li>
          </ul>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Moderation and enforcement</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Pave currently supports in-product reporting and basic moderation safeguards. There is not yet a full internal moderation
          console, so enforcement is intentionally conservative and focused on keeping the public surfaces usable and safe.
        </p>
      </section>
    </div>
  );
}

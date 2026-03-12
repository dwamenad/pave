import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@pave.app";

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Privacy</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Pave stores the account, trip, post, engagement, and device/session data needed to operate planning, publishing,
          moderation, and mobile continuity. This page is the current in-product baseline, not a full legal compliance review.
        </p>
      </section>

      <section className="surface-card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>account identity and profile information</li>
            <li>trips, saved posts, comments, follows, reports, and export requests</li>
            <li>anonymous session identifiers for product analytics and feed events</li>
            <li>mobile device and token state for the beta app when mobile auth is in use</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Current product boundaries</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Posts currently support external <code>http(s)</code> media URLs only. Native uploads are not part of the product yet.</li>
            <li>Comments, group voting, and social engagement are stored, but they are not realtime systems.</li>
            <li>The mobile app is a beta client and shares the same backend systems as the web product.</li>
          </ul>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Questions or requests</h2>
        </div>
        <a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href={`mailto:${supportEmail}`}>
          <Mail className="h-4 w-4" />
          {supportEmail}
        </a>
      </section>
    </div>
  );
}

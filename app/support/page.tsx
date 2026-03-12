import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@pave.app";

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Safety and Support</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Report abuse in-app using the report button on posts or comments. For urgent support requests,
          contact our moderation team directly.
        </p>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Support Contact</h2>
        <a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href={`mailto:${supportEmail}`}>
          <Mail className="h-4 w-4" />
          {supportEmail}
        </a>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link className="font-semibold text-primary hover:underline" href="/privacy">
            Privacy
          </Link>
          <Link className="font-semibold text-primary hover:underline" href="/terms">
            Terms
          </Link>
        </div>
      </section>
    </div>
  );
}

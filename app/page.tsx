import Link from "next/link";
import { LandingForm } from "@/components/landing-form";

export default function HomePage() {
  return (
    <div className="space-y-6 py-4">
      <LandingForm />
      <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
        <p>
          Want instant mobile picks instead? Try <Link href="/nearby" className="text-primary underline">Nearby Now</Link>.
        </p>
        <p>
          Explore community itineraries on the <Link href="/feed" className="text-primary underline">Social Feed</Link> or{" "}
          <Link href="/create" className="text-primary underline">create a personalized trip</Link>.
        </p>
      </div>
    </div>
  );
}

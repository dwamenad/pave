import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPostDetail } from "@/lib/server/social-service";
import { PostDetailClient } from "@/components/post-detail-client";

export const dynamic = "force-dynamic";
export default async function PostDetailPage({ params }: { params: { postId: string } }) {
  const user = await getCurrentUser();
  const post = await getPostDetail(params.postId, user?.id);
  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Link href="/feed" className="text-sm font-semibold text-primary hover:underline">Back to feed</Link>
      <section className="rounded-2xl border bg-white p-5">
        <h1 className="text-2xl font-extrabold tracking-tight">{post.destinationLabel || post.trip.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Itinerary post detail, source links, and remix actions.</p>
      </section>
      <PostDetailClient initialPost={post} />
    </div>
  );
}

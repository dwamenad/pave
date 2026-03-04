import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { trackEvent } from "@/lib/server/events";
import { getSessionTokenFromRequest } from "@/lib/server/session";
import { getPostDetail } from "@/lib/server/social-service";
import { PostDetailClient } from "@/components/post-detail-client";

export const dynamic = "force-dynamic";
export default async function PostDetailPage({ params }: { params: { postId: string } }) {
  const user = await getCurrentUser();
  const sessionId = getSessionTokenFromRequest();
  const post = await getPostDetail(params.postId, user?.id);
  if (!post) {
    notFound();
  }

  await trackEvent({
    name: "view_post",
    userId: user?.id,
    sessionId,
    props: {
      postId: params.postId
    }
  });

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href="/feed" className="hover:text-primary">Feed</Link>
        <span>/</span>
        <span className="font-medium text-slate-700">{post.destinationLabel || post.trip.title}</span>
      </nav>
      <PostDetailClient initialPost={post} />
    </div>
  );
}

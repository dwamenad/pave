import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/server/social-service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="surface-card p-6 text-sm text-muted-foreground">
        Please sign in to view notifications.
      </div>
    );
  }

  const notifications = await getNotifications(user.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Updates about follows, comments, and remixes.</p>
      </div>

      {notifications.items.length ? (
        <ul className="space-y-3">
          {notifications.items.map((notification) => (
            <li key={notification.id} className="surface-card p-4 text-sm">
              <p className="font-semibold">{notification.type}</p>
              <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
              {notification.entityId ? (
                <p className="mt-1 text-xs text-muted-foreground">Entity: {notification.entityId}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="surface-card p-6 text-sm text-muted-foreground">No notifications yet.</div>
      )}

      <Link href="/feed" className="text-sm font-semibold text-primary hover:underline">
        Back to feed
      </Link>
    </div>
  );
}

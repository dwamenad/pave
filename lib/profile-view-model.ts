export type ProfileTab = "posts" | "saved";

export function normalizeProfileTab(input?: string): ProfileTab {
  if (input === "saved") return "saved";
  return "posts";
}

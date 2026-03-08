type FeedItemWithId = {
  id: string;
};

type FeedPage<T extends FeedItemWithId> = {
  items: T[];
};

export function mergeUniqueFeedItems<T extends FeedItemWithId>(pages: Array<FeedPage<T>>) {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const page of pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }

  return out;
}

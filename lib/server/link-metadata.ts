import { URL } from "node:url";
import type { SourceLinkMetadata } from "@/lib/types";

const TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const OG_TITLE_REGEX = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const OG_DESC_REGEX = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const OG_IMAGE_REGEX = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;

function clean(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim();
}

export function extractUrlHints(url: string) {
  return url
    .replace(/https?:\/\//, "")
    .split(/[\/?#&_=.-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
    .slice(0, 12);
}

export async function fetchLinkMetadata(url: string): Promise<SourceLinkMetadata> {
  let parsed: URL | null = null;
  try {
    parsed = new URL(url);
  } catch {
    return {
      url,
      domain: "unknown",
      parsedHints: extractUrlHints(url)
    };
  }

  let title: string | undefined;
  let description: string | undefined;
  let thumbnailUrl: string | undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "OneClickAwayBot/1.0"
      }
    });
    clearTimeout(timeout);

    const html = await response.text();

    title = clean(html.match(OG_TITLE_REGEX)?.[1] || html.match(TITLE_REGEX)?.[1]);
    description = clean(html.match(OG_DESC_REGEX)?.[1]);
    thumbnailUrl = clean(html.match(OG_IMAGE_REGEX)?.[1]);
  } catch {
    // Best-effort metadata; fallback to URL hints.
  }

  return {
    url,
    domain: parsed.hostname,
    title,
    description,
    thumbnailUrl,
    parsedHints: extractUrlHints(url)
  };
}

export async function fetchMetadataForLinks(links: string[]) {
  const unique = Array.from(new Set(links.map((link) => link.trim()).filter(Boolean))).slice(0, 5);
  return Promise.all(unique.map((link) => fetchLinkMetadata(link)));
}

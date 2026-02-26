import { URL } from "node:url";
import { resolve4, resolve6 } from "node:dns/promises";
import { isIP } from "node:net";
import type { SourceLinkMetadata } from "@/lib/types";

const TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const OG_TITLE_REGEX = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const OG_DESC_REGEX = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const OG_IMAGE_REGEX = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 200_000;
const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "host.docker.internal",
  "metadata.google.internal"
]);

function clean(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim();
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function isPrivateIpv6(ip: string) {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
  return false;
}

function isPrivateIp(ip: string) {
  if (isIP(ip) === 4) return isPrivateIpv4(ip);
  if (isIP(ip) === 6) return isPrivateIpv6(ip);
  return true;
}

async function isSafeHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(normalized)) return false;
  if (normalized.endsWith(".local")) return false;
  if (isIP(normalized)) {
    return !isPrivateIp(normalized);
  }

  const [aRecords, aaaaRecords] = await Promise.all([
    resolve4(normalized).catch(() => [] as string[]),
    resolve6(normalized).catch(() => [] as string[])
  ]);
  const addresses = [...aRecords, ...aaaaRecords];
  if (!addresses.length) return false;
  return addresses.every((ip) => !isPrivateIp(ip));
}

async function fetchHtmlSafely(inputUrl: string): Promise<string | null> {
  let currentUrl = inputUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    const parsed = new URL(currentUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const safeHost = await isSafeHostname(parsed.hostname);
    if (!safeHost) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "OneClickAwayBot/1.0"
      }
    }).catch(() => null);
    clearTimeout(timeout);

    if (!response) return null;

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      return null;
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html")) {
      return null;
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
      return null;
    }

    const html = await response.text().catch(() => "");
    return html.slice(0, MAX_HTML_BYTES);
  }

  return null;
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
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Unsupported protocol");
    }
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
    const html = await fetchHtmlSafely(url);
    if (!html) {
      return {
        url,
        domain: parsed.hostname,
        parsedHints: extractUrlHints(url)
      };
    }

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

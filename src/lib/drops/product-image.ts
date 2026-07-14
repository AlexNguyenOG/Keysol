import {
  assertPublicHttpUrl,
  getPublicUrlGuardOptions,
} from "@/lib/security/url";
import { fetchPublicHtml } from "@/lib/security/safe-fetch";

const LOGO_HINT =
  /logo|og-image|facebook-og|twitter-card|default[_-]?share|placeholder/i;

function extractCandidateImageUrls(html: string, baseUrl: string): string[] {
  const found: string[] = [];
  const patterns = [
    /property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi,
    /name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      if (match[1]) {
        found.push(match[1]);
      }
    }
  }

  // Absolute product CDN URLs commonly embedded in retailer pages.
  for (const match of html.matchAll(
    /https?:\/\/[^"'\\\s>]+\.(?:jpe?g|png|webp)(?:\?[^"'\\\s>]*)?/gi,
  )) {
    found.push(match[0]);
  }

  const normalized: string[] = [];
  for (const raw of found) {
    try {
      const href = new URL(raw, baseUrl).href.replace(/^http:\/\//i, "https://");
      if (!normalized.includes(href)) {
        normalized.push(href);
      }
    } catch {
      // ignore bad URLs
    }
  }

  return normalized;
}

function scoreProductImage(url: string): number {
  let score = 0;
  const lower = url.toLowerCase();

  if (LOGO_HINT.test(lower)) {
    score -= 50;
  }
  if (/product|keyboard|huntsman|keychron|ducky|fallout|dayz|edition|1500x1000|1200/i.test(lower)) {
    score += 20;
  }
  if (/\.(jpe?g|webp)(\?|$)/i.test(lower)) {
    score += 5;
  }
  if (/500x500|96x96|78x78|thumb|icon/i.test(lower)) {
    score -= 10;
  }

  return score;
}

/**
 * Best-effort product image from a retailer page (og/twitter image, then CDN hints).
 * Returns null when nothing trustworthy is found.
 */
export async function resolveProductImageUrl(
  productUrl: string,
): Promise<string | null> {
  if (!(await assertPublicHttpUrl(productUrl, { httpsOnly: true }))) {
    return null;
  }

  const html = await fetchPublicHtml(productUrl, {
    urlOptions: getPublicUrlGuardOptions(),
    timeoutMs: 8_000,
    maxBytes: 800_000,
  });

  if (!html) {
    return null;
  }

  const candidates = extractCandidateImageUrls(html, productUrl)
    .filter((url) => !LOGO_HINT.test(url))
    .sort((a, b) => scoreProductImage(b) - scoreProductImage(a));

  for (const url of candidates.slice(0, 8)) {
    if (await assertPublicHttpUrl(url, { httpsOnly: true })) {
      return url;
    }
  }

  return null;
}

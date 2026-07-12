import { getPublicUrlGuardOptions, isPublicHttpUrl } from "@/lib/security/url";
import { fetchPublicHtml } from "@/lib/security/safe-fetch";
import {
  DROP_SCAN_SOURCES,
  DROP_SIGNAL_PATTERNS,
} from "@/lib/drops/sources";
import { upsertDropCandidate } from "@/lib/drops/store";
import type { DropCandidate } from "@/lib/drops/types";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 1_500_000;
const MIN_CONFIDENCE = 0.45;
const MAX_PRODUCT_FOLLOW_UPS = 8;

const USER_AGENT =
  "Mozilla/5.0 (compatible; KeySolDropScanner/1.0; +https://github.com/Let-it-happen339/Keysol)";

interface DetectedLink {
  name: string;
  url: string;
  snippet: string;
  signals: string[];
  confidence: number;
}

interface ProductFollowUp {
  name: string;
  url: string;
  listingSignals: string[];
  listingConfidence: number;
}

function scoreText(text: string): { signals: string[]; confidence: number } {
  const signals: string[] = [];
  let confidence = 0;

  for (const entry of DROP_SIGNAL_PATTERNS) {
    entry.pattern.lastIndex = 0;
    if (entry.pattern.test(text)) {
      signals.push(entry.signal);
      confidence += entry.weight;
    }
  }

  return {
    signals,
    confidence: Math.min(confidence, 1),
  };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isKeyboardContext(text: string): boolean {
  return /keyboard|keycap|switch|he\b|magnetic|hall|tkl|60%|65%|75%|80%|full.?size|keypad/i.test(
    text,
  );
}

function looksLikeProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (/\/collections?\//.test(path) || path === "/" || path === "") {
      return false;
    }

    return (
      /\/products?\//.test(path) ||
      /\/p\//.test(path) ||
      /\/gaming-keyboards\//.test(path) ||
      /keyboard|keybord|60he|80he|tkl|apex|blackwidow|huntsman|alloy|one\d|q[0-9]|k[0-9]{2}/i.test(
        path,
      )
    );
  } catch {
    return false;
  }
}

function isKeyboardProduct(name: string, url: string, snippet: string): boolean {
  const context = `${name} ${snippet} ${url}`;
  if (
    /keycap set|keycaps only|switch set\b/i.test(context) &&
    !/keyboard/i.test(context)
  ) {
    return false;
  }
  return isKeyboardContext(context) || looksLikeProductUrl(url);
}

function normalizeProductUrl(url: string): string {
  return url
    .split("#")[0]
    .replace(/\/buy\/?$/i, "")
    .replace(/\/$/, "");
}

function extractTitle(html: string): string | null {
  const og = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) {
    return og[1].trim().slice(0, 120);
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title?.[1]) {
    return stripTags(title[1]).slice(0, 120);
  }

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    return stripTags(h1[1]).slice(0, 120);
  }

  return null;
}

function extractLinks(html: string, baseUrl: string): DetectedLink[] {
  const results: DetectedLink[] = [];
  const anchorRe =
    /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorRe)) {
    const href = match[1];
    const rawText = stripTags(match[2]);

    if (!href || rawText.length < 4) {
      continue;
    }

    let url: string;
    try {
      url = new URL(href, baseUrl).href;
    } catch {
      continue;
    }

    if (!isPublicHttpUrl(url, getPublicUrlGuardOptions())) {
      continue;
    }

    const contextStart = Math.max(0, (match.index ?? 0) - 180);
    const contextEnd = Math.min(html.length, (match.index ?? 0) + match[0].length + 180);
    const snippet = stripTags(html.slice(contextStart, contextEnd)).slice(0, 280);

    const combined = `${rawText} ${snippet} ${url}`;
    const scored = scoreText(combined);

    if (scored.confidence < MIN_CONFIDENCE) {
      continue;
    }

    if (!isKeyboardContext(combined)) {
      continue;
    }

    results.push({
      name: rawText.slice(0, 120),
      url,
      snippet,
      signals: scored.signals,
      confidence: scored.confidence,
    });
  }

  return results;
}

function collectProductFollowUps(
  html: string,
  baseUrl: string,
  pageScore: { signals: string[]; confidence: number },
): ProductFollowUp[] {
  const seen = new Set<string>();
  const followUps: ProductFollowUp[] = [];
  const anchorRe =
    /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorRe)) {
    const href = match[1];
    const rawText = stripTags(match[2]);
    if (!href) {
      continue;
    }

    let url: string;
    try {
      url = new URL(href, baseUrl).href;
    } catch {
      continue;
    }

    if (!isPublicHttpUrl(url, getPublicUrlGuardOptions())) {
      continue;
    }

    if (!looksLikeProductUrl(url)) {
      continue;
    }

    const normalized = normalizeProductUrl(url);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    const contextStart = Math.max(0, (match.index ?? 0) - 180);
    const contextEnd = Math.min(html.length, (match.index ?? 0) + match[0].length + 180);
    const snippet = stripTags(html.slice(contextStart, contextEnd));
    const combined = `${rawText} ${snippet} ${url}`;
    const linkScore = scoreText(combined);
    const keyboardish = isKeyboardContext(combined) || looksLikeProductUrl(url);

    if (!keyboardish) {
      continue;
    }

    // Prefer links that already look limited, otherwise follow when the listing page is LE-heavy.
    const shouldFollow =
      linkScore.confidence >= 0.2 ||
      pageScore.confidence >= 0.35 ||
      /limited|special|edition|collab|exclusive|signature|collector|\ble\b/i.test(
        combined,
      );

    if (!shouldFollow) {
      continue;
    }

    followUps.push({
      name: (rawText || normalized).slice(0, 120),
      url: normalized,
      listingSignals: linkScore.signals,
      listingConfidence: linkScore.confidence,
    });
  }

  return followUps
    .sort((a, b) => b.listingConfidence - a.listingConfidence)
    .slice(0, MAX_PRODUCT_FOLLOW_UPS);
}

async function fetchHtml(url: string): Promise<string | null> {
  return fetchPublicHtml(url, {
    timeoutMs: FETCH_TIMEOUT_MS,
    maxBytes: MAX_HTML_BYTES,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
}

async function upsertFromDetection(input: {
  brandId: string;
  name: string;
  url: string;
  signals: string[];
  confidence: number;
  snippet: string;
}): Promise<DropCandidate | null> {
  if (
    input.confidence < MIN_CONFIDENCE ||
    !isKeyboardProduct(input.name, input.url, input.snippet)
  ) {
    return null;
  }

  return upsertDropCandidate({
    brandId: input.brandId,
    name: input.name,
    sourceUrl: input.url,
    purchaseUrl: input.url,
    detectionSource: "scanner",
    signals: input.signals,
    confidence: Math.min(input.confidence, 1),
    rawSnippet: input.snippet,
  });
}

export async function scanForDropCandidates(): Promise<{
  scanned: number;
  createdOrUpdated: DropCandidate[];
}> {
  const createdOrUpdated: DropCandidate[] = [];
  const seenUrls = new Set<string>();

  for (const source of DROP_SCAN_SOURCES) {
    const html = await fetchHtml(source.url);
    if (!html) {
      continue;
    }

    const pageScore = scoreText(html);
    const links = extractLinks(html, source.url);

    for (const link of links) {
      // Listing pages often mention LE somewhere; only keep link-local signals.
      if (seenUrls.has(normalizeProductUrl(link.url))) {
        continue;
      }
      seenUrls.add(normalizeProductUrl(link.url));

      const candidate = await upsertFromDetection({
        brandId: source.brandId,
        name: link.name,
        url: normalizeProductUrl(link.url),
        signals: link.signals,
        confidence: link.confidence,
        snippet: link.snippet,
      });

      if (candidate) {
        createdOrUpdated.push(candidate);
      }
    }

    const followUps = collectProductFollowUps(html, source.url, pageScore);
    for (const followUp of followUps) {
      if (seenUrls.has(normalizeProductUrl(followUp.url))) {
        continue;
      }

      const productHtml = await fetchHtml(followUp.url);
      if (!productHtml) {
        continue;
      }

      const name = extractTitle(productHtml) ?? followUp.name;
      const metaDescription =
        productHtml.match(
          /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i,
        )?.[1] ??
        productHtml.match(
          /content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i,
        )?.[1] ??
        "";
      const focusedText = `${name} ${metaDescription} ${followUp.name} ${followUp.url}`;
      const focusedScore = scoreText(focusedText);
      const bodyScore = scoreText(
        stripTags(productHtml.replace(/<script[\s\S]*?<\/script>/gi, " ")).slice(
          0,
          2500,
        ),
      );

      const hasStrongEditionSignal = focusedScore.signals.some((signal) =>
        /edition|takeover|collaboration|limited|LE badge|unit cap|numbered/i.test(
          signal,
        ),
      );

      // Title/URL edition cues are enough; body-only matches need a higher bar.
      const productConfidence = hasStrongEditionSignal
        ? Math.max(focusedScore.confidence, 0.45)
        : focusedScore.confidence >= MIN_CONFIDENCE
          ? focusedScore.confidence
          : bodyScore.confidence >= 0.7
            ? bodyScore.confidence
            : followUp.listingConfidence >= MIN_CONFIDENCE
              ? followUp.listingConfidence
              : 0;

      if (productConfidence < MIN_CONFIDENCE) {
        continue;
      }

      const productText = stripTags(
        productHtml.replace(/<script[\s\S]*?<\/script>/gi, " "),
      ).slice(0, 4000);

      const mergedSignals = Array.from(
        new Set([
          ...followUp.listingSignals,
          ...focusedScore.signals,
          ...(focusedScore.confidence >= 0.3 ? bodyScore.signals : []),
        ]),
      );

      seenUrls.add(normalizeProductUrl(followUp.url));

      const candidate = await upsertFromDetection({
        brandId: source.brandId,
        name,
        url: normalizeProductUrl(followUp.url),
        signals: mergedSignals,
        confidence: Math.min(productConfidence, 1),
        snippet: productText.slice(0, 280),
      });

      if (candidate) {
        createdOrUpdated.push(candidate);
      }
    }
  }

  return {
    scanned: DROP_SCAN_SOURCES.length,
    createdOrUpdated,
  };
}

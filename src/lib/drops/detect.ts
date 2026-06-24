import { isPublicHttpUrl, getPublicUrlGuardOptions } from "@/lib/security/url";
import {
  DROP_SCAN_SOURCES,
  DROP_SIGNAL_PATTERNS,
} from "@/lib/drops/sources";
import { upsertDropCandidate } from "@/lib/drops/store";
import type { DropCandidate } from "@/lib/drops/types";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 512 * 1024;
const MIN_CONFIDENCE = 0.45;

const USER_AGENT =
  "Mozilla/5.0 (compatible; KeySolDropScanner/1.0; +https://github.com/Let-it-happen339/Keysol)";

interface DetectedLink {
  name: string;
  url: string;
  snippet: string;
  signals: string[];
  confidence: number;
}

function scoreText(text: string): { signals: string[]; confidence: number } {
  const signals: string[] = [];
  let confidence = 0;

  for (const entry of DROP_SIGNAL_PATTERNS) {
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

function extractLinks(html: string, baseUrl: string): DetectedLink[] {
  const results: DetectedLink[] = [];
  const anchorRe =
    /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorRe)) {
    const href = match[1];
    const rawText = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

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

    const contextStart = Math.max(0, (match.index ?? 0) - 120);
    const contextEnd = Math.min(html.length, (match.index ?? 0) + match[0].length + 120);
    const snippet = html
      .slice(contextStart, contextEnd)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const combined = `${rawText} ${snippet}`;
    const scored = scoreText(combined);

    if (scored.confidence < MIN_CONFIDENCE) {
      continue;
    }

    if (!/keyboard|keycap|switch|he\b|magnetic|hall|tkl|60%|65%|75%|80%|full/i.test(combined)) {
      continue;
    }

    results.push({
      name: rawText.slice(0, 120),
      url,
      snippet: snippet.slice(0, 280),
      signals: scored.signals,
      confidence: scored.confidence,
    });
  }

  return results;
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      return null;
    }

    return new TextDecoder().decode(buffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanForDropCandidates(): Promise<{
  scanned: number;
  createdOrUpdated: DropCandidate[];
}> {
  const createdOrUpdated: DropCandidate[] = [];

  for (const source of DROP_SCAN_SOURCES) {
    const html = await fetchHtml(source.url);
    if (!html) {
      continue;
    }

    const pageScore = scoreText(html);
    const links = extractLinks(html, source.url);

    for (const link of links) {
      const mergedSignals = Array.from(
        new Set([...link.signals, ...pageScore.signals]),
      );
      const confidence = Math.min(
        1,
        link.confidence + (pageScore.confidence > 0 ? 0.1 : 0),
      );

      if (confidence < MIN_CONFIDENCE) {
        continue;
      }

      const candidate = upsertDropCandidate({
        brandId: source.brandId,
        name: link.name,
        sourceUrl: link.url,
        purchaseUrl: link.url,
        detectionSource: "scanner",
        signals: mergedSignals,
        confidence,
        rawSnippet: link.snippet,
      });

      createdOrUpdated.push(candidate);
    }
  }

  return {
    scanned: DROP_SCAN_SOURCES.length,
    createdOrUpdated,
  };
}

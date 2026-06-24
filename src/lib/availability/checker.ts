import https from "node:https";
import { getAllKeyboards } from "@/lib/catalog.server";
import { isPublicHttpUrl, getPublicUrlGuardOptions } from "@/lib/security/url";
import type { Keyboard } from "@/types";
import {
  isStale,
  mergeRecords,
  readCache,
  writeCache,
} from "./cache";
import { parseAvailabilityFromHtml } from "./parse";
import type { AvailabilityMap, AvailabilityRecord } from "./types";
import { FETCH_TIMEOUT_MS } from "./types";

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const USER_AGENT =
  "Mozilla/5.0 (compatible; KeySol/1.0; +https://github.com/Let-it-happen339/Keysol)";

const FETCH_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

function isHeadersOverflowError(error: unknown): boolean {
  if (!(error instanceof TypeError)) {
    return false;
  }

  const cause = error.cause as { code?: string } | undefined;
  return cause?.code === "UND_ERR_HEADERS_OVERFLOW";
}

function fetchWithHttpsLargeHeaders(
  url: string,
  redirectCount = 0,
): Promise<string> {
  if (!isPublicHttpUrl(url, getPublicUrlGuardOptions())) {
    return Promise.reject(new Error("Blocked URL"));
  }

  if (redirectCount > MAX_REDIRECTS) {
    return Promise.reject(new Error("Too many redirects"));
  }

  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);
    const req = https.get(
      {
        hostname: requestUrl.hostname,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        headers: FETCH_HEADERS,
        maxHeaderSize: 65536,
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          const nextUrl = new URL(response.headers.location, url).href;
          resolve(fetchWithHttpsLargeHeaders(nextUrl, redirectCount + 1));
          return;
        }

        if (!response.statusCode || response.statusCode >= 400) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode ?? "error"}`));
          return;
        }

        let body = "";
        let bytes = 0;
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          bytes += Buffer.byteLength(chunk, "utf8");
          if (bytes > MAX_RESPONSE_BYTES) {
            req.destroy(new Error("Response too large"));
            return;
          }
          body += chunk;
        });
        response.on("end", () => resolve(body));
      },
    );

    req.on("error", reject);
    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy(new Error("Timeout"));
    });
  });
}

async function readResponseText(response: Response): Promise<string> {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    bytes += value.byteLength;
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("Response too large");
    }

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();
  return body;
}

async function fetchPurchasePage(
  url: string,
  redirectCount = 0,
): Promise<string> {
  if (!isPublicHttpUrl(url, getPublicUrlGuardOptions())) {
    throw new Error("Blocked URL");
  }

  if (redirectCount > MAX_REDIRECTS) {
    throw new Error("Too many redirects");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: FETCH_HEADERS,
      redirect: "manual",
      cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Redirect without location");
      }

      const nextUrl = new URL(location, url).href;
      return fetchPurchasePage(nextUrl, redirectCount + 1);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await readResponseText(response);
  } catch (error) {
    if (isHeadersOverflowError(error)) {
      return fetchWithHttpsLargeHeaders(url);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkKeyboardAvailability(
  keyboard: Keyboard,
): Promise<AvailabilityRecord> {
  const checkedAt = new Date().toISOString();

  if (!isPublicHttpUrl(keyboard.purchaseUrl, getPublicUrlGuardOptions())) {
    return {
      keyboardId: keyboard.id,
      status: "unknown",
      checkedAt,
      source: keyboard.purchaseUrl,
      error: "Invalid purchase URL",
    };
  }

  try {
    const html = await fetchPurchasePage(keyboard.purchaseUrl);
    const status = parseAvailabilityFromHtml(html);

    return {
      keyboardId: keyboard.id,
      status,
      checkedAt,
      source: keyboard.purchaseUrl,
    };
  } catch (error) {
    return {
      keyboardId: keyboard.id,
      status: "unknown",
      checkedAt,
      source: keyboard.purchaseUrl,
      error: error instanceof Error ? error.message : "Check failed",
    };
  }
}

export async function refreshAvailability(options?: {
  force?: boolean;
  keyboardIds?: string[];
}): Promise<AvailabilityMap> {
  const force = options?.force ?? false;
  const cache = await readCache();

  const catalog = getAllKeyboards();

  const targets = options?.keyboardIds
    ? catalog.filter((keyboard) => options.keyboardIds!.includes(keyboard.id))
    : catalog;

  const staleTargets = force
    ? targets
    : targets.filter((keyboard) => isStale(cache[keyboard.id]));

  const updates = await Promise.all(
    staleTargets.map((keyboard) => checkKeyboardAvailability(keyboard)),
  );

  const next = mergeRecords(cache, updates);
  await writeCache(next);
  return next;
}

export async function getAvailability(options?: {
  refresh?: boolean;
}): Promise<AvailabilityMap> {
  if (options?.refresh) {
    return refreshAvailability({ force: true });
  }

  const cache = await readCache();

  // Vercel/serverless: never block page loads on 26 parallel retailer scrapes.
  // Serve bundled snapshot (or warm memory) and refresh via cron/CI instead.
  if (process.env.VERCEL === "1") {
    return cache;
  }

  const catalog = getAllKeyboards();
  const needsRefresh = catalog.some((keyboard) => isStale(cache[keyboard.id]));

  if (needsRefresh) {
    return refreshAvailability();
  }

  return cache;
}

export function seedUnknownAvailability(): AvailabilityMap {
  const checkedAt = new Date(0).toISOString();
  return Object.fromEntries(
    getAllKeyboards().map((keyboard) => [
      keyboard.id,
      {
        keyboardId: keyboard.id,
        status: "unknown" as const,
        checkedAt,
        source: keyboard.purchaseUrl,
      },
    ]),
  );
}

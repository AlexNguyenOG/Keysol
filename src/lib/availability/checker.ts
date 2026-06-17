import { keyboards } from "@/data/keyboards";
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

const USER_AGENT =
  "KeySol/1.0 (+https://github.com/Let-it-happen339/Keysol; availability checker)";

async function fetchPurchasePage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkKeyboardAvailability(
  keyboard: Keyboard,
): Promise<AvailabilityRecord> {
  const checkedAt = new Date().toISOString();

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

  const targets = options?.keyboardIds
    ? keyboards.filter((keyboard) => options.keyboardIds!.includes(keyboard.id))
    : keyboards;

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
  const cache = await readCache();
  const needsRefresh = keyboards.some((keyboard) => isStale(cache[keyboard.id]));

  if (options?.refresh || needsRefresh) {
    return refreshAvailability({ force: options?.refresh });
  }

  return cache;
}

export function seedUnknownAvailability(): AvailabilityMap {
  const checkedAt = new Date(0).toISOString();
  return Object.fromEntries(
    keyboards.map((keyboard) => [
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

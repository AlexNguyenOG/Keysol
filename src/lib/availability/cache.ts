import fs from "node:fs/promises";
import path from "node:path";
import type { AvailabilityMap, AvailabilityRecord } from "./types";
import { CACHE_TTL_MS } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "availability.json");

let memoryCache: AvailabilityMap | null = null;

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

export async function readCache(): Promise<AvailabilityMap> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    memoryCache = JSON.parse(raw) as AvailabilityMap;
    return memoryCache;
  } catch {
    memoryCache = {};
    return memoryCache;
  }
}

export async function writeCache(map: AvailabilityMap): Promise<void> {
  memoryCache = map;
  await ensureCacheDir();
  await fs.writeFile(CACHE_FILE, JSON.stringify(map, null, 2), "utf8");
}

export function isStale(record: AvailabilityRecord | undefined): boolean {
  if (!record) {
    return true;
  }

  const age = Date.now() - new Date(record.checkedAt).getTime();
  return age >= CACHE_TTL_MS;
}

export function mergeRecords(
  current: AvailabilityMap,
  updates: AvailabilityRecord[],
): AvailabilityMap {
  const next = { ...current };

  for (const record of updates) {
    next[record.keyboardId] = record;
  }

  return next;
}

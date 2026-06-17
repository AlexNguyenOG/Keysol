export type AvailabilityStatus =
  | "in_stock"
  | "out_of_stock"
  | "limited"
  | "unknown";

export interface AvailabilityRecord {
  keyboardId: string;
  status: AvailabilityStatus;
  checkedAt: string;
  source: string;
  error?: string;
}

export type AvailabilityMap = Record<string, AvailabilityRecord>;

export const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const FETCH_TIMEOUT_MS = 12_000;

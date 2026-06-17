import { parseDomainAvailability } from "./domains";
import type { AvailabilityStatus } from "./types";

const SCHEMA_IN_STOCK =
  /schema\.org\/(InStock|OnlineOnly|PreOrder|PreSale|LimitedAvailability)/i;
const SCHEMA_OUT_OF_STOCK = /schema\.org\/(OutOfStock|SoldOut|Discontinued)/i;

const OUT_OF_STOCK_PHRASES = [
  "out of stock",
  "sold out",
  "currently unavailable",
  "unavailable for purchase",
  "temporarily out of stock",
  "notify me when available",
  "notify me when in stock",
  "email when available",
  "backorder only",
];

const LIMITED_PHRASES = [
  "limited stock",
  "low stock",
  "only a few left",
  "few left in stock",
  "almost gone",
];

const IN_STOCK_PHRASES = [
  "add to cart",
  "add to bag",
  "add to basket",
  "buy now",
  "buy it now",
  "order now",
  "in stock",
  "add to order",
  "ready to ship",
];

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function collectSchemaStatuses(data: unknown, statuses: AvailabilityStatus[]): void {
  if (!data || typeof data !== "object") {
    return;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      collectSchemaStatuses(item, statuses);
    }
    return;
  }

  const record = data as Record<string, unknown>;

  if (typeof record.availability === "string") {
    const status = schemaUrlToStatus(record.availability);
    if (status) {
      statuses.push(status);
    }
  }

  if (record.offers) {
    collectSchemaStatuses(record.offers, statuses);
  }

  if (record["@graph"]) {
    collectSchemaStatuses(record["@graph"], statuses);
  }
}

function parseJsonLdAvailability(html: string): AvailabilityStatus | null {
  const blocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  if (!blocks) {
    return null;
  }

  const statuses: AvailabilityStatus[] = [];

  for (const block of blocks) {
    const jsonText = block
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();

    try {
      const data = JSON.parse(jsonText) as unknown;
      collectSchemaStatuses(data, statuses);
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return mergeAvailabilityStatuses(statuses);
}

function schemaUrlToStatus(value: string): AvailabilityStatus | null {
  if (SCHEMA_OUT_OF_STOCK.test(value)) {
    return "out_of_stock";
  }

  if (/LimitedAvailability/i.test(value)) {
    return "limited";
  }

  if (SCHEMA_IN_STOCK.test(value)) {
    return "in_stock";
  }

  return null;
}

function mergeAvailabilityStatuses(
  statuses: AvailabilityStatus[],
): AvailabilityStatus | null {
  if (statuses.length === 0) {
    return null;
  }

  if (statuses.includes("in_stock")) {
    return "in_stock";
  }

  if (statuses.includes("limited")) {
    return "limited";
  }

  if (statuses.includes("out_of_stock")) {
    return "out_of_stock";
  }

  return null;
}

function parseEmbeddedJsonAvailability(html: string): AvailabilityStatus | null {
  const hasAvailableTrue = /"available"\s*:\s*true/i.test(html);
  const hasAvailableFalse = /"available"\s*:\s*false/i.test(html);
  const hasInStockTrue =
    /"in_stock"\s*:\s*true/i.test(html) || /"isInStock"\s*:\s*true/i.test(html);
  const hasInStockFalse =
    /"in_stock"\s*:\s*false/i.test(html) || /"isInStock"\s*:\s*false/i.test(html);

  if (hasAvailableTrue || hasInStockTrue) {
    return "in_stock";
  }

  if (hasAvailableFalse || hasInStockFalse) {
    return "out_of_stock";
  }

  if (/"inventory_quantity"\s*:\s*0\b/i.test(html)) {
    return "out_of_stock";
  }

  return null;
}

function phraseMatch(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function parsePhraseAvailability(html: string): AvailabilityStatus | null {
  const text = stripTags(html);
  const hasInStock = phraseMatch(text, IN_STOCK_PHRASES);
  const hasOutOfStock = phraseMatch(text, OUT_OF_STOCK_PHRASES);
  const hasLimited = phraseMatch(text, LIMITED_PHRASES);

  if (hasInStock && hasOutOfStock) {
    // Related products or footer copy often mention sold-out items while the
    // primary product still has a buy button.
    if (/add to cart|buy now|buy it now|order now|ready to ship/i.test(html)) {
      return "in_stock";
    }
    return "out_of_stock";
  }

  if (hasOutOfStock) {
    return "out_of_stock";
  }

  if (hasLimited) {
    return "limited";
  }

  if (hasInStock) {
    return "in_stock";
  }

  return null;
}

export function parseAvailabilityFromHtml(
  html: string,
  purchaseUrl?: string,
): AvailabilityStatus {
  if (purchaseUrl) {
    const domainStatus = parseDomainAvailability(html, purchaseUrl);
    if (domainStatus) {
      return domainStatus;
    }
  }

  const jsonLdStatus = parseJsonLdAvailability(html);
  if (jsonLdStatus) {
    return jsonLdStatus;
  }

  const embeddedStatus = parseEmbeddedJsonAvailability(html);
  if (embeddedStatus) {
    return embeddedStatus;
  }

  if (SCHEMA_IN_STOCK.test(html) && !SCHEMA_OUT_OF_STOCK.test(html)) {
    return "in_stock";
  }

  if (SCHEMA_OUT_OF_STOCK.test(html) && !SCHEMA_IN_STOCK.test(html)) {
    return "out_of_stock";
  }

  if (/schema\.org\/LimitedAvailability/i.test(html)) {
    return "limited";
  }

  const phraseStatus = parsePhraseAvailability(html);
  if (phraseStatus) {
    return phraseStatus;
  }

  return "unknown";
}

import type { AvailabilityStatus } from "./types";

const SCHEMA_IN_STOCK =
  /schema\.org\/(InStock|OnlineOnly|PreOrder|PreSale|LimitedAvailability)/i;
const SCHEMA_OUT_OF_STOCK = /schema\.org\/(OutOfStock|SoldOut|Discontinued)/i;

const OUT_OF_STOCK_PHRASES = [
  "out of stock",
  "sold out",
  "currently unavailable",
  "not available",
  "no longer available",
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
  "in stock",
  "add to order",
];

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parseJsonLdAvailability(html: string): AvailabilityStatus | null {
  const blocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  if (!blocks) {
    return null;
  }

  for (const block of blocks) {
    const jsonText = block
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();

    try {
      const data = JSON.parse(jsonText) as unknown;
      const status = findSchemaAvailability(data);
      if (status) {
        return status;
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return null;
}

function findSchemaAvailability(data: unknown): AvailabilityStatus | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const status = findSchemaAvailability(item);
      if (status) {
        return status;
      }
    }
    return null;
  }

  const record = data as Record<string, unknown>;

  if (typeof record.availability === "string") {
    return schemaUrlToStatus(record.availability);
  }

  if (record.offers) {
    const offerStatus = findSchemaAvailability(record.offers);
    if (offerStatus) {
      return offerStatus;
    }
  }

  if (record["@graph"]) {
    return findSchemaAvailability(record["@graph"]);
  }

  return null;
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

function parseEmbeddedJsonAvailability(html: string): AvailabilityStatus | null {
  if (/"available"\s*:\s*false/i.test(html)) {
    return "out_of_stock";
  }

  if (/"in_stock"\s*:\s*false/i.test(html) || /"isInStock"\s*:\s*false/i.test(html)) {
    return "out_of_stock";
  }

  if (/"available"\s*:\s*true/i.test(html) || /"in_stock"\s*:\s*true/i.test(html)) {
    return "in_stock";
  }

  if (/"inventory_quantity"\s*:\s*0\b/i.test(html)) {
    return "out_of_stock";
  }

  return null;
}

function phraseMatch(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

export function parseAvailabilityFromHtml(html: string): AvailabilityStatus {
  const jsonLdStatus = parseJsonLdAvailability(html);
  if (jsonLdStatus) {
    return jsonLdStatus;
  }

  const embeddedStatus = parseEmbeddedJsonAvailability(html);
  if (embeddedStatus) {
    return embeddedStatus;
  }

  if (SCHEMA_OUT_OF_STOCK.test(html)) {
    return "out_of_stock";
  }

  if (/schema\.org\/LimitedAvailability/i.test(html)) {
    return "limited";
  }

  if (SCHEMA_IN_STOCK.test(html)) {
    return "in_stock";
  }

  const text = stripTags(html);

  if (phraseMatch(text, OUT_OF_STOCK_PHRASES)) {
    return "out_of_stock";
  }

  if (phraseMatch(text, LIMITED_PHRASES)) {
    return "limited";
  }

  if (phraseMatch(text, IN_STOCK_PHRASES)) {
    return "in_stock";
  }

  return "unknown";
}

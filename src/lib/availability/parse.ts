import type { AvailabilityStatus } from "./types";

/** Visible purchase CTAs that mean a keyboard can be bought right now. */
const IN_STOCK_PHRASES = [
  "add to cart",
  "order now",
  "buy now",
  "buy it now",
] as const;

const IN_STOCK_PATTERN = new RegExp(IN_STOCK_PHRASES.join("|"), "i");
const IN_STOCK_BUTTON_PATTERN = new RegExp(
  IN_STOCK_PHRASES.map((phrase) => phrase.replace(/\s+/g, "\\s+")).join("|"),
  "i",
);

const SCHEMA_IN_STOCK = /schema\.org\/(InStock|OnlineOnly|PreOrder|PreSale)/i;
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
];

function stripScriptsAndStyles(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function pageText(html: string): string {
  return stripScriptsAndStyles(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function hasShopifyPurchasableVariant(html: string): boolean {
  const multiSelectInputs =
    html.match(/name="id\[\]"[^>]*form="product-form[^"]*"[^>]*>/gi) ?? [];
  if (multiSelectInputs.some((input) => !/\bdisabled\b/i.test(input))) {
    return true;
  }

  const variantOptions =
    html.match(/<option[^>]*value="\d+"[^>]*>[^<]*<\/option>/gi) ?? [];
  return variantOptions.some(
    (option) =>
      !/\bdisabled\b/i.test(option) && !/sold out/i.test(option),
  );
}

function hasPurchaseOption(html: string): boolean {
  const visible = stripScriptsAndStyles(html);

  const enabledButtons =
    visible.match(/<button(?![^>]*\bdisabled\b)[^>]*>[\s\S]*?<\/button>/gi) ??
    [];
  if (enabledButtons.some((button) => IN_STOCK_BUTTON_PATTERN.test(button))) {
    return true;
  }

  const enabledInputs =
    visible.match(/<input(?![^>]*\bdisabled\b)[^>]*>/gi) ?? [];
  if (enabledInputs.some((input) => IN_STOCK_BUTTON_PATTERN.test(input))) {
    return true;
  }

  const enabledLinks =
    visible.match(
      /<a(?![^>]*\baria-disabled=["']true["'])[^>]*>[\s\S]*?<\/a>/gi,
    ) ?? [];
  if (enabledLinks.some((link) => IN_STOCK_BUTTON_PATTERN.test(link))) {
    return true;
  }

  // Match purchase CTAs in aria-labels (Corsair bundles, etc. are ignored below).
  const ariaLabels =
    visible.match(/aria-label=["']([^"']+)["']/gi) ?? [];
  if (
    ariaLabels.some((label) => {
      if (/more to consider|bundle/i.test(label)) {
        return false;
      }
      return IN_STOCK_BUTTON_PATTERN.test(label);
    })
  ) {
    return true;
  }

  // Keychron/Shopify: submit button may read "Sold out" for the default variant while
  // other variants remain purchasable via the same add-to-cart flow.
  if (
    /data-add-to-cart-text=["']add to cart["']/i.test(html) &&
    hasShopifyPurchasableVariant(html)
  ) {
    return true;
  }

  if (!IN_STOCK_PATTERN.test(pageText(html))) {
    return false;
  }

  const withoutDisabledButtons = visible.replace(
    /<button[^>]*\bdisabled\b[^>]*>[\s\S]*?<\/button>/gi,
    " ",
  );

  return IN_STOCK_PATTERN.test(pageText(withoutDisabledButtons));
}

function parseJsonLdAvailability(html: string): AvailabilityStatus | null {
  const blocks =
    html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];

  let hasInStock = false;
  let hasOutOfStock = false;

  for (const block of blocks) {
    const jsonText = block
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();

    if (SCHEMA_IN_STOCK.test(jsonText)) {
      hasInStock = true;
    }
    if (SCHEMA_OUT_OF_STOCK.test(jsonText)) {
      hasOutOfStock = true;
    }
  }

  if (hasInStock) {
    return "in_stock";
  }

  if (hasOutOfStock) {
    return "out_of_stock";
  }

  return null;
}

function hasEmbeddedPurchaseConfig(html: string): boolean {
  if (
    /addToCartButtonTitle["'\s]*:["'\s]*["']Add to Cart["']/i.test(html) ||
    /"cta(?:Label|Text)"\s*:\s*"(?:Buy Now|Add to Cart|Order Now)"/i.test(html)
  ) {
    return true;
  }

  const hasBuyFlowMarkup =
    /add-to-cart-placeholder|add-to-cart-button|PDP_add-to-cart/i.test(html);

  const hasStructuredInStock =
    SCHEMA_IN_STOCK.test(html) ||
    /"availability"\s*:\s*"InStock"/i.test(html) ||
    /"inventoryStatus"\s*:\s*"IN_STOCK"/i.test(html);

  if (hasBuyFlowMarkup && hasStructuredInStock) {
    return true;
  }

  if (
    hasStructuredInStock &&
    IN_STOCK_PATTERN.test(html) &&
    !SCHEMA_OUT_OF_STOCK.test(html) &&
    !/"availability"\s*:\s*"OutOfStock"/i.test(html)
  ) {
    return true;
  }

  return false;
}

function hasOutOfStockSignal(html: string): boolean {
  const text = pageText(html);
  return OUT_OF_STOCK_PHRASES.some((phrase) => text.includes(phrase));
}

export function parseAvailabilityFromHtml(html: string): AvailabilityStatus {
  if (hasPurchaseOption(html)) {
    return "in_stock";
  }

  const jsonLdStatus = parseJsonLdAvailability(html);
  if (jsonLdStatus === "in_stock") {
    return "in_stock";
  }

  if (hasEmbeddedPurchaseConfig(html)) {
    return "in_stock";
  }

  if (jsonLdStatus === "out_of_stock" || hasOutOfStockSignal(html)) {
    return "out_of_stock";
  }

  return "unknown";
}

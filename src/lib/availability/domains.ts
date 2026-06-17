import type { AvailabilityStatus } from "./types";

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function shopifyHasPurchasableVariant(html: string): boolean {
  const multiSelectInputs =
    html.match(/name="id\[\]"[^>]*form="product-form[^"]*"[^>]*>/gi) ?? [];
  if (
    multiSelectInputs.some((input) => !/\bdisabled\b/i.test(input))
  ) {
    return true;
  }

  const variantOptions =
    html.match(/<option[^>]*value="\d+"[^>]*>[^<]*<\/option>/gi) ?? [];
  return variantOptions.some(
    (option) =>
      !/\bdisabled\b/i.test(option) && !/sold out/i.test(option),
  );
}

function shopifyAvailability(html: string): AvailabilityStatus | null {
  const hasAvailableTrue = /"available"\s*:\s*true/i.test(html);
  const hasAvailableFalse = /"available"\s*:\s*false/i.test(html);
  const hasBuyButton = /add to cart|buy it now|pre-?order/i.test(html);
  const hasPurchasableVariant = shopifyHasPurchasableVariant(html);

  if (hasAvailableTrue || hasBuyButton || hasPurchasableVariant) {
    return "in_stock";
  }

  if (hasAvailableFalse || /\bsold out\b/i.test(html)) {
    return "out_of_stock";
  }

  return null;
}

function walmartAvailability(html: string): AvailabilityStatus | null {
  if (/add to cart/i.test(html) && !/out of stock/i.test(html)) {
    return "in_stock";
  }

  if (/out of stock|sold out/i.test(html)) {
    return "out_of_stock";
  }

  return null;
}

function logitechAvailability(html: string): AvailabilityStatus | null {
  if (/buy now|add to cart|in stock\. ready to ship/i.test(html)) {
    return "in_stock";
  }

  if (/out of stock|sold out|notify me/i.test(html)) {
    return "out_of_stock";
  }

  return null;
}

function wootingAvailability(html: string): AvailabilityStatus | null {
  if (/order now|add to cart|buy now/i.test(html)) {
    return "in_stock";
  }

  if (/sold out|out of stock|unavailable/i.test(html)) {
    return "out_of_stock";
  }

  return null;
}

export function parseDomainAvailability(
  html: string,
  purchaseUrl: string,
): AvailabilityStatus | null {
  const host = hostFromUrl(purchaseUrl);

  if (host === "wooting.io") {
    return wootingAvailability(html);
  }

  if (host === "logitechg.com") {
    return logitechAvailability(html);
  }

  if (host === "walmart.com") {
    return walmartAvailability(html);
  }

  if (
    host.endsWith("keychron.com") ||
    host.endsWith("hyperx.com") ||
    host.endsWith("mechanicalkeyboards.com") ||
    host.includes("shopify")
  ) {
    return shopifyAvailability(html);
  }

  if (host.endsWith("razer.com") || host.endsWith("steelseries.com")) {
    if (/add to cart|buy now|in stock/i.test(html)) {
      return "in_stock";
    }
  }

  if (host.endsWith("corsair.com")) {
    if (/add to cart|buy now/i.test(html)) {
      return "in_stock";
    }
  }

  return null;
}

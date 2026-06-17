import { describe, expect, it } from "vitest";
import { parseAvailabilityFromHtml } from "./parse";

describe("parseAvailabilityFromHtml", () => {
  it("detects schema.org InStock from JSON-LD", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@type": "Product",
          "offers": {
            "availability": "https://schema.org/InStock"
          }
        }
      </script>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects schema.org OutOfStock from JSON-LD", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@type": "Product",
          "offers": {
            "availability": "https://schema.org/OutOfStock"
          }
        }
      </script>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("out_of_stock");
  });

  it("prefers in stock when JSON-LD includes mixed offer availability", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@graph": [
            {
              "@type": "Product",
              "offers": { "availability": "https://schema.org/OutOfStock" }
            },
            {
              "@type": "Product",
              "offers": { "availability": "https://schema.org/InStock" }
            }
          ]
        }
      </script>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects sold out phrases in page text", () => {
    const html = "<button disabled>Sold out</button><p>Notify me when available</p>";
    expect(parseAvailabilityFromHtml(html)).toBe("out_of_stock");
  });

  it("detects add to cart as in stock", () => {
    const html = "<button>Add to cart</button>";
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects limited stock", () => {
    const html = "<p>Only a few left in stock</p>";
    expect(parseAvailabilityFromHtml(html)).toBe("limited");
  });

  it("returns unknown when no signals are found", () => {
    const html = "<html><body><h1>Product page</h1></body></html>";
    expect(parseAvailabilityFromHtml(html)).toBe("unknown");
  });

  it("prefers in stock when a buy button exists alongside sold-out copy", () => {
    const html = `
      <main><button>Add to cart</button><p>Some variants sold out</p></main>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("treats Shopify pages with any available variant as in stock", () => {
    const html = `
      {"available":false}
      {"available":true}
      <button>Add to cart</button>
    `;

    expect(
      parseAvailabilityFromHtml(
        html,
        "https://www.keychron.com/products/keychron-q1-he",
      ),
    ).toBe("in_stock");
  });

  it("treats Keychron pages with purchasable variants as in stock even when sold out copy exists", () => {
    const html = `
      {"available":false}
      <p>Sold out</p>
      <input type="checkbox" name="id[]" value="42571231985753" form="product-form-template--123__main">
      <input type="checkbox" name="id[]" value="41839101673561" disabled form="product-form-template--123__main">
    `;

    expect(
      parseAvailabilityFromHtml(
        html,
        "https://www.keychron.com/products/keychron-k2-he-wireless-magnetic-switch-keyboard",
      ),
    ).toBe("in_stock");
  });

  it("prefers add to cart over sold-out variant JSON on Shopify pages", () => {
    const html = `
      {"available":false}
      <button>Add to cart</button>
      <p>Related product sold out</p>
    `;

    expect(
      parseAvailabilityFromHtml(
        html,
        "https://www.keychron.com/products/keychron-k2-he-wireless-magnetic-switch-keyboard",
      ),
    ).toBe("in_stock");
  });

  it("detects Walmart add to cart as in stock", () => {
    const html = `<button>Add to cart</button>`;

    expect(
      parseAvailabilityFromHtml(
        html,
        "https://www.walmart.com/ip/example/123",
      ),
    ).toBe("in_stock");
  });
});

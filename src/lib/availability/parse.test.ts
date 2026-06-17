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

  it("prefers out of stock over add to cart in unrelated sections", () => {
    const html = `
      <main>This item is out of stock</main>
      <footer>Customers also bought items with add to cart buttons</footer>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("out_of_stock");
  });
});

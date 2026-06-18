import { describe, expect, it } from "vitest";
import { parseAvailabilityFromHtml } from "./parse";

describe("parseAvailabilityFromHtml", () => {
  it("returns in stock when the page has an enabled add to cart button", () => {
    const html = "<main><button>Add to cart</button></main>";
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("returns in stock when add to cart appears alongside sold-out copy", () => {
    const html = `
      <main><button>Add to cart</button><p>Some variants sold out</p></main>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("returns out of stock when only a disabled add to cart control is present", () => {
    const html = `
      <main><button disabled>Add to cart</button><p>Sold out</p></main>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("out_of_stock");
  });

  it("returns out of stock for sold out pages without add to cart", () => {
    const html = "<button disabled>Sold out</button><p>Notify me when available</p>";
    expect(parseAvailabilityFromHtml(html)).toBe("out_of_stock");
  });

  it("returns unknown when no purchase or sold-out signals are found", () => {
    const html = "<html><body><h1>Product page</h1></body></html>";
    expect(parseAvailabilityFromHtml(html)).toBe("unknown");
  });

  it("ignores add to cart text inside scripts", () => {
    const html = `
      <script>const label = "Add to cart";</script>
      <p>Sold out</p>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("out_of_stock");
  });

  it("detects Walmart add to cart as in stock", () => {
    const html = `<button>Add to cart</button>`;
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects Wooting order now as in stock", () => {
    const html = `<button>Order now</button>`;
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects buy now as in stock", () => {
    const html = `<button>Buy now</button>`;
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects schema.org InStock in JSON-LD", () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Product","offers":{"availability":"https://schema.org/InStock"}}
      </script>
    `;
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects SteelSeries add-to-cart config in embedded JSON", () => {
    const html = `
      <script>{"addToCartButtonTitle":"Add to Cart"}</script>
    `;
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects Corsair hydrated add-to-cart placeholders with InStock schema", () => {
    const html = `
      <script type="application/ld+json">
        {"offers":{"availability":"https://schema.org/InStock"}}
      </script>
      <div id="add-to-cart-placeholder-desktop"></div>
    `;
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("detects Corsair inventory JSON as in stock", () => {
    const html = `
      <script>{"availability":"InStock","inventoryStatus":"IN_STOCK"}</script>
      <div id="add-to-cart-placeholder-desktop"></div>
    `;
    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("treats Keychron pages with add-to-cart flow and enabled variants as in stock", () => {
    const html = `
      <form id="product-form-template--123__main">
        <button type="submit" data-add-to-cart-text="Add to cart" disabled>Sold out</button>
        <input type="checkbox" name="id[]" value="42571231985753" form="product-form-template--123__main">
        <input type="checkbox" name="id[]" value="41839101673561" disabled form="product-form-template--123__main">
      </form>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("in_stock");
  });

  it("returns out of stock for Keychron pages when every variant is unavailable", () => {
    const html = `
      <form id="product-form-template--123__main">
        <button type="submit" data-add-to-cart-text="Add to cart" disabled>Sold out</button>
        <input type="checkbox" name="id[]" value="41839101673561" disabled form="product-form-template--123__main">
        <p>Sold out</p>
      </form>
    `;

    expect(parseAvailabilityFromHtml(html)).toBe("out_of_stock");
  });
});

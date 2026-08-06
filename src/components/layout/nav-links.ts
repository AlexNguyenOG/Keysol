export const NAV_LINKS = [
  { href: "/#brands", label: "Brands" },
  { href: "/rankings", label: "Rankings" },
  { href: "/value-trends", label: "Value Trends" },
  { href: "/tokens", label: "Collectibles" },
  { href: "/solana-keyboards", label: "Solana Keyboards" },
  { href: "/#about", label: "About" },
] as const;

/** Official Solana Foundation collab board featured on /solana-keyboards. */
export const SOLANA_KEYBOARD = {
  name: "Solana x Thock King TK65 Pro",
  tagline:
    "Limited Solana Foundation collab — black aluminum 65% with Solana gradient legends.",
  image: "/keyboards/solana-x-thock-king-tk65-pro.jpg",
  purchaseUrl:
    "https://www.thockking.com/products/solana-x-thock-king-tk65-pro-custom-65-aluminum-wireless-mechanical-keyboard",
  priceUsd: 189,
  releasedAt: "2024-12-05",
  highlights: [
    "65% full aluminum case with metal knob (heavier than plastic boards)",
    "Tri-mode: USB-C, Bluetooth, 2.4 GHz",
    "Custom Solana gradient PBT legends",
    "Stock TTC Silent Brown V2 RGB tactiles — 5-pin hot-swappable",
  ],
  facts: [
    {
      label: "Switches",
      value: "TTC Silent Brown V2 (tactile, muted)",
    },
    {
      label: "Hot-swap",
      value: "Yes — 5-pin MX-style",
    },
    {
      label: "Mount",
      value: "Gasket, foam + silicone dampening",
    },
    {
      label: "Release",
      value: "Dec 5, 2024 · one-time Onchain Holiday run",
    },
  ],
} as const;

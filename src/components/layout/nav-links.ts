export const NAV_LINKS = [
  { href: "/#brands", label: "Brands" },
  { href: "/rankings", label: "Rankings" },
  { href: "/value-trends", label: "Value Trends" },
  { href: "/tokens", label: "Token Guide" },
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
  highlights: [
    "65% aluminum case with metal knob",
    "Tri-mode: USB-C, Bluetooth, 2.4 GHz",
    "Custom Solana gradient PBT legends",
    "TTC Silent Brown RGB tactile switches",
  ],
} as const;

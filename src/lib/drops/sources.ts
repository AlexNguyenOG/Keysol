/** Brand pages scanned for limited-edition keyboard drops. */
export interface DropScanSource {
  brandId: string;
  label: string;
  url: string;
}

export const DROP_SCAN_SOURCES: DropScanSource[] = [
  {
    brandId: "wooting",
    label: "Wooting store",
    url: "https://wooting.io/",
  },
  {
    brandId: "keychron",
    label: "Keychron keyboards",
    url: "https://www.keychron.com/collections/keyboards",
  },
  {
    brandId: "razer",
    label: "Razer keyboards",
    url: "https://www.razer.com/pc/gaming-keyboards",
  },
  {
    brandId: "corsair",
    label: "Corsair keyboards",
    url: "https://www.corsair.com/us/en/c/keyboards",
  },
  {
    brandId: "steelseries",
    label: "SteelSeries keyboards",
    url: "https://steelseries.com/gaming-keyboards",
  },
  {
    brandId: "hyperx",
    label: "HyperX keyboards",
    url: "https://hyperx.com/collections/gaming-keyboards",
  },
  {
    brandId: "ducky",
    label: "Ducky shop",
    url: "https://ducky.global/collections/keyboards",
  },
  {
    brandId: "nuphy",
    label: "NuPhy keyboards",
    url: "https://nuphy.com/collections/keyboards",
  },
];

export const DROP_SIGNAL_PATTERNS = [
  { pattern: /limited edition/i, signal: "limited edition", weight: 0.35 },
  { pattern: /\bLE\b/, signal: "LE badge", weight: 0.25 },
  { pattern: /special edition/i, signal: "special edition", weight: 0.3 },
  { pattern: /exclusive/i, signal: "exclusive", weight: 0.2 },
  { pattern: /collab/i, signal: "collaboration", weight: 0.25 },
  { pattern: /#\/?\s*\d+\s*(?:units|made|pcs)?/i, signal: "numbered run", weight: 0.35 },
  { pattern: /only\s+\d+\s+(?:units|available)/i, signal: "unit cap", weight: 0.4 },
  { pattern: /special switch/i, signal: "special switches", weight: 0.25 },
  { pattern: /keycap set/i, signal: "special keycaps", weight: 0.2 },
  { pattern: /drop/i, signal: "drop language", weight: 0.15 },
];

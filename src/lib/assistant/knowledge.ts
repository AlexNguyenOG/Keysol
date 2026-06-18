import { brands } from "@/data/brands";
import { keyboards } from "@/data/keyboards";
import { getBrandName } from "@/lib/keyboards";
import { computeSpeedScore, SCORE_CRITERIA } from "@/lib/rankings";
import type { Keyboard } from "@/types";

export function formatKeyboardSummary(keyboard: Keyboard): string {
  const { stats } = keyboard;
  const score = computeSpeedScore(keyboard);

  return [
    `${keyboard.name} (${getBrandName(keyboard.brandId)})`,
    `$${keyboard.priceUsd} · speed score ${score}/100`,
    `${stats.layout} · ${stats.switchType}`,
    `${stats.pollingRateHz} Hz polling · ${stats.actuationPointMm} mm actuation`,
    stats.connectivity.join(", "),
    stats.rapidTrigger ? "rapid trigger: yes" : "rapid trigger: no",
    keyboard.tagline,
  ].join(" · ");
}

export function buildCatalogContext(): string {
  const brandLines = brands.map(
    (brand) =>
      `${brand.name}: ${brand.tagline}. Highlights: ${brand.highlights.join("; ")}`,
  );

  const keyboardLines = keyboards.map((keyboard) => formatKeyboardSummary(keyboard));

  const criteriaLines = SCORE_CRITERIA.map(
    (item) => `${item.label}: ${item.description}`,
  );

  return [
    "BRANDS:",
    ...brandLines,
    "",
    "KEYBOARDS IN CATALOG:",
    ...keyboardLines,
    "",
    "SPEED SCORE CRITERIA:",
    ...criteriaLines,
  ].join("\n");
}

export function findKeyboardsByQuery(query: string): Keyboard[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9%+]+/)
    .filter((term) => term.length > 1);

  if (terms.length === 0) {
    return [];
  }

  return keyboards
    .map((keyboard) => {
      const haystack = [
        keyboard.name,
        keyboard.brandId,
        getBrandName(keyboard.brandId),
        keyboard.tagline,
        keyboard.stats.switchType,
        keyboard.stats.layout,
        keyboard.stats.connectivity.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matches = terms.filter((term) => haystack.includes(term)).length;
      return { keyboard, matches };
    })
    .filter((entry) => entry.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map((entry) => entry.keyboard);
}

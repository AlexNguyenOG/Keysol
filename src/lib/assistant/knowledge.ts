import { brands } from "@/data/brands";
import { keyboards as catalogKeyboards } from "@/data/keyboards";
import { switchCategories, switchTypes } from "@/data/switch-types";
import { keyboardTokens } from "@/data/keyboard-tokens";
import { getBrandName } from "@/lib/keyboards";
import { computeSpeedScore, SCORE_CRITERIA } from "@/lib/rankings";
import type { Keyboard } from "@/types";
import { getCatalogStats } from "./rules";

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

function formatSwitchSummary(entry: (typeof switchTypes)[number]): string {
  const linkedKeyboards = entry.keyboardIds
    .map((id) => catalogKeyboards.find((keyboard) => keyboard.id === id)?.name)
    .filter(Boolean);

  return [
    `${entry.name}: ${entry.tagline}`,
    `Actuation: ${entry.actuation}`,
    `Best for: ${entry.bestFor}`,
    entry.rapidTrigger ? "Rapid trigger: yes" : "Rapid trigger: no",
    linkedKeyboards.length > 0
      ? `Catalog boards: ${linkedKeyboards.join(", ")}`
      : "Catalog boards: none listed",
  ].join(" · ");
}

export function buildSwitchContext(): string {
  const categoryLines = switchCategories.map(
    (category) => `${category.name}: ${category.summary}`,
  );

  const switchLines = switchTypes.map((entry) => formatSwitchSummary(entry));

  return [
    "SWITCH TECHNOLOGY GUIDE:",
    ...categoryLines,
    "",
    "SWITCH PROFILES:",
    ...switchLines,
  ].join("\n");
}

export function buildSiteContext(): string {
  const { keyboardCount, brandCount } = getCatalogStats();

  return [
    "KEYSOL SITE FEATURES:",
    `- Catalog: ${keyboardCount} keyboards across ${brandCount} brands (always use this list — it is current).`,
    "- /rankings — speed score leaderboard",
    "- /value-trends — token value trends",
    "- /tokens — KeySol keyboard token guide (collectibles roadmap; wallet minting not live yet)",
    "- Home page includes a Switch Technology Guide section",
  ].join("\n");
}

export function buildTokenContext(): string {
  const topTokens = [...keyboardTokens]
    .sort((a, b) => b.rarityScore - a.rarityScore)
    .slice(0, 8)
    .map(
      (token) =>
        `${token.symbol}: ${token.name} (catalog score ${token.rarityScore})`,
    );

  return [
    "KEYSOL TOKEN GUIDE (roadmap — not live wallet minting yet):",
    ...topTokens,
    "Full token list and catalog scores: /tokens",
  ].join("\n");
}

export function buildCatalogContext(): string {
  const brandLines = brands.map(
    (brand) =>
      `${brand.name}: ${brand.tagline}. Highlights: ${brand.highlights.join("; ")}`,
  );

  const keyboardLines = catalogKeyboards.map((keyboard) =>
    formatKeyboardSummary(keyboard),
  );

  const criteriaLines = SCORE_CRITERIA.map(
    (item) => `${item.label}: ${item.description}`,
  );

  return [
    buildSiteContext(),
    "",
    "BRANDS:",
    ...brandLines,
    "",
    "KEYBOARDS IN CATALOG:",
    ...keyboardLines,
    "",
    buildSwitchContext(),
    "",
    buildTokenContext(),
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

  return catalogKeyboards
    .map((keyboard) => {
      const haystack = [
        keyboard.name,
        keyboard.id,
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

export function findSwitchTypesByQuery(query: string) {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9%+]+/)
    .filter((term) => term.length > 1);

  if (terms.length === 0) {
    return [];
  }

  return switchTypes
    .map((entry) => {
      const haystack = [
        entry.name,
        entry.id,
        entry.tagline,
        entry.howItWorks,
        entry.actuation,
        entry.bestFor,
        entry.categoryId,
      ]
        .join(" ")
        .toLowerCase();

      const matches = terms.filter((term) => haystack.includes(term)).length;
      return { entry, matches };
    })
    .filter((item) => item.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map((item) => item.entry);
}

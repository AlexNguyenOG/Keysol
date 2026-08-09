import { brands } from "@/data/brands";
import { keyboards as catalogKeyboards } from "@/data/keyboards";
import { switchCategories, switchTypes } from "@/data/switch-types";
import { keyboardTokens } from "@/data/keyboard-tokens";
import { SOLANA_KEYBOARD } from "@/components/layout/nav-links";
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

export function buildSolanaKeyboardContext(): string {
  return [
    "SOLANA COLLAB KEYBOARD (featured on /solana-keyboards, not in the speed catalog):",
    `${SOLANA_KEYBOARD.name} — $${SOLANA_KEYBOARD.priceUsd}`,
    SOLANA_KEYBOARD.tagline,
    `Released ${SOLANA_KEYBOARD.releasedAt} as a one-time Solana Onchain Holiday / Foundation collab with Thock King.`,
    `Highlights: ${SOLANA_KEYBOARD.highlights.join("; ")}`,
    `Facts: ${SOLANA_KEYBOARD.facts.map((fact) => `${fact.label}: ${fact.value}`).join("; ")}`,
    `Buy: ${SOLANA_KEYBOARD.purchaseUrl}`,
    "Note: leftover Assembled Solana Editions may still be listed; barebone TK65 Pro variants are the standard board without Solana keycaps.",
  ].join("\n");
}

export function buildSiteContext(): string {
  const { keyboardCount, brandCount } = getCatalogStats();

  return [
    "KEYSOL SITE FEATURES:",
    `- Catalog: ${keyboardCount} keyboards across ${brandCount} brands (always use this list — it is current).`,
    "- /rankings — speed score leaderboard (supports ?brand=&q=&layout=&stock=&rt= URL filters)",
    "- /value-trends — token value trends",
    "- /tokens — KeySol keyboard token collectibles (Devnet claims live when enabled)",
    "- /solana-keyboards — Solana × Thock King TK65 Pro collab page",
    "- Home page includes a Switch Technology Guide section",
    "",
    buildSolanaKeyboardContext(),
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
    "KEYSOL TOKEN GUIDE (Devnet pilot claims available on /tokens):",
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

import "server-only";

import { keyboards as staticKeyboards } from "@/data/keyboards";
import { keyboardTokens as staticTokens } from "@/data/keyboard-tokens";
import { listPublishedDrops } from "@/lib/drops/store";
import type { PublishedDrop } from "@/lib/drops/types";
import { computeSpeedScore } from "@/lib/rankings";
import type { Keyboard, KeyboardToken } from "@/types";

export function getPublishedDropKeyboards(): Keyboard[] {
  return listPublishedDrops().map((drop) => drop.keyboard);
}

export function getAllKeyboards(): Keyboard[] {
  const staticIds = new Set(staticKeyboards.map((keyboard) => keyboard.id));
  const dropKeyboards = getPublishedDropKeyboards().filter(
    (keyboard) => !staticIds.has(keyboard.id),
  );

  return [...staticKeyboards, ...dropKeyboards];
}

export function getAllKeyboardTokens(): KeyboardToken[] {
  const staticIds = new Set(staticTokens.map((token) => token.id));
  const dropTokens = listPublishedDrops()
    .map((drop) => drop.token)
    .filter((token) => !staticIds.has(token.id));

  return [...staticTokens, ...dropTokens];
}

export function getFeaturedDrops(): PublishedDrop[] {
  return listPublishedDrops();
}

export function getKeyboardById(id: string): Keyboard | undefined {
  return getAllKeyboards().find((keyboard) => keyboard.id === id);
}

export function isDropKeyboard(id: string): boolean {
  return listPublishedDrops().some((drop) => drop.keyboardId === id);
}

/** Brand keyboards ordered by speed score (highest first). */
export function getKeyboardsByBrandIdSorted(brandId: string): Keyboard[] {
  return getAllKeyboards()
    .filter((keyboard) => keyboard.brandId === brandId)
    .sort((a, b) => computeSpeedScore(b) - computeSpeedScore(a));
}

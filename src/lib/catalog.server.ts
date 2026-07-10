import "server-only";

import { keyboards as staticKeyboards } from "@/data/keyboards";
import { keyboardTokens as staticTokens } from "@/data/keyboard-tokens";
import { listPublishedDrops } from "@/lib/drops/store";
import type { PublishedDrop } from "@/lib/drops/types";
import { computeSpeedScore } from "@/lib/rankings";
import type { Keyboard, KeyboardToken } from "@/types";

export async function getPublishedDropKeyboards(): Promise<Keyboard[]> {
  return (await listPublishedDrops()).map((drop) => drop.keyboard);
}

export async function getAllKeyboards(): Promise<Keyboard[]> {
  const staticIds = new Set(staticKeyboards.map((keyboard) => keyboard.id));
  const dropKeyboards = (await getPublishedDropKeyboards()).filter(
    (keyboard) => !staticIds.has(keyboard.id),
  );

  return [...staticKeyboards, ...dropKeyboards];
}

export async function getAllKeyboardTokens(): Promise<KeyboardToken[]> {
  const staticIds = new Set(staticTokens.map((token) => token.id));
  const dropTokens = (await listPublishedDrops())
    .map((drop) => drop.token)
    .filter((token) => !staticIds.has(token.id));

  return [...staticTokens, ...dropTokens];
}

export async function getFeaturedDrops(): Promise<PublishedDrop[]> {
  return listPublishedDrops();
}

export async function getKeyboardById(
  id: string,
): Promise<Keyboard | undefined> {
  return (await getAllKeyboards()).find((keyboard) => keyboard.id === id);
}

export async function isDropKeyboard(id: string): Promise<boolean> {
  return (await listPublishedDrops()).some((drop) => drop.keyboardId === id);
}

/** Brand keyboards ordered by speed score (highest first). */
export async function getKeyboardsByBrandIdSorted(
  brandId: string,
): Promise<Keyboard[]> {
  return (await getAllKeyboards())
    .filter((keyboard) => keyboard.brandId === brandId)
    .sort((a, b) => computeSpeedScore(b) - computeSpeedScore(a));
}

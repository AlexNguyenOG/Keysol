import {
  getKeyboardShowcase,
  keyboardHasShowcase,
} from "@/data/keyboard-showcases";

/** Local copies of official brand commercials (not catalog stills). */
export function getShowcaseVideoSrc(keyboardId: string): string {
  return `/keyboards/showcases/${keyboardId}.mp4`;
}

export function getShowcaseAttribution(keyboardId: string): string | null {
  return getKeyboardShowcase(keyboardId)?.credit ?? null;
}

export { getKeyboardShowcase, keyboardHasShowcase };

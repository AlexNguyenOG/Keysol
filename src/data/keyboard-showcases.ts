/**
 * Official brand showcase clips for hover playback.
 * Sources are manufacturer YouTube commercials — not derived from catalog stills.
 * Clip ranges are trimmed to keyboard/product B-roll (no on-camera presenters).
 *
 * Run `npm run showcase:fetch` to download clips into `public/keyboards/showcases/`.
 */
export interface KeyboardShowcase {
  keyboardId: string;
  /** YouTube video ID from the brand's official channel. */
  youtubeId: string;
  /** Inclusive start of the cinematic segment (seconds). */
  clipStartSec: number;
  /** Exclusive end of the cinematic segment (seconds). */
  clipEndSec: number;
  credit: string;
}

export const keyboardShowcases: KeyboardShowcase[] = [
  {
    keyboardId: "wooting-60he-plus",
    youtubeId: "MAJl103M9bI",
    clipStartSec: 98,
    clipEndSec: 110,
    credit: "Wooting",
  },
  {
    keyboardId: "wooting-two-he",
    youtubeId: "zF0j9jYA6WY",
    clipStartSec: 12,
    clipEndSec: 24,
    credit: "Wooting",
  },
  {
    keyboardId: "wooting-80he",
    youtubeId: "BSlKt7m7xXk",
    clipStartSec: 6,
    clipEndSec: 18,
    credit: "Wooting",
  },
  {
    keyboardId: "razer-huntsman-v3-pro-tkl-8khz",
    youtubeId: "-sgKUGlkoCs",
    clipStartSec: 0,
    clipEndSec: 12,
    credit: "Razer",
  },
  {
    keyboardId: "razer-huntsman-v3-pro-mini",
    youtubeId: "-sgKUGlkoCs",
    clipStartSec: 2,
    clipEndSec: 14,
    credit: "Razer",
  },
  {
    keyboardId: "razer-huntsman-v3-pro-8khz",
    youtubeId: "-sgKUGlkoCs",
    clipStartSec: 5,
    clipEndSec: 17,
    credit: "Razer",
  },
  {
    keyboardId: "corsair-k70-max",
    youtubeId: "HINi3P5ddZg",
    clipStartSec: 0,
    clipEndSec: 12,
    credit: "CORSAIR",
  },
  {
    keyboardId: "corsair-k70-pro-tkl-he",
    youtubeId: "HINi3P5ddZg",
    clipStartSec: 34,
    clipEndSec: 46,
    credit: "CORSAIR",
  },
  {
    keyboardId: "corsair-k70-rgb-pro",
    youtubeId: "v05USwmya8w",
    clipStartSec: 12,
    clipEndSec: 24,
    credit: "CORSAIR",
  },
  {
    keyboardId: "corsair-k70-rgb-mk2",
    youtubeId: "uvfaXQSVCPM",
    clipStartSec: 12,
    clipEndSec: 24,
    credit: "CORSAIR",
  },
  {
    keyboardId: "logitech-g515-rapid-tkl",
    youtubeId: "JaszAd88NVI",
    clipStartSec: 0,
    clipEndSec: 12,
    credit: "Logitech G",
  },
  {
    keyboardId: "logitech-g-pro-x-tkl-lightspeed",
    youtubeId: "VsNQ_bHpztE",
    clipStartSec: 84,
    clipEndSec: 96,
    credit: "Logitech G",
  },
  {
    keyboardId: "keychron-k2-he",
    youtubeId: "gpR7srp0QwA",
    clipStartSec: 12,
    clipEndSec: 24,
    credit: "Keychron",
  },
  {
    keyboardId: "keychron-q1-he",
    youtubeId: "gpR7srp0QwA",
    clipStartSec: 41,
    clipEndSec: 53,
    credit: "Keychron",
  },
  {
    keyboardId: "keychron-q3-he-8k",
    youtubeId: "zd-NOkWjABQ",
    clipStartSec: 16,
    clipEndSec: 28,
    credit: "Keychron",
  },
  {
    keyboardId: "keychron-q6-he-8k",
    youtubeId: "zd-NOkWjABQ",
    clipStartSec: 30,
    clipEndSec: 42,
    credit: "Keychron",
  },
  {
    keyboardId: "steelseries-apex-pro-gen3",
    youtubeId: "MfjUpteMEHc",
    clipStartSec: 1,
    clipEndSec: 13,
    credit: "SteelSeries",
  },
  {
    keyboardId: "steelseries-apex-pro-gen3-tkl",
    youtubeId: "oJPnSXQZchA",
    clipStartSec: 8,
    clipEndSec: 20,
    credit: "SteelSeries",
  },
  {
    keyboardId: "steelseries-apex-pro-tkl-v2",
    youtubeId: "9F1ZlinK8Ps",
    clipStartSec: 50,
    clipEndSec: 62,
    credit: "SteelSeries",
  },
  {
    keyboardId: "steelseries-apex-pro-mini",
    youtubeId: "9F1ZlinK8Ps",
    clipStartSec: 54,
    clipEndSec: 66,
    credit: "SteelSeries",
  },
  {
    keyboardId: "hyperx-alloy-rise",
    youtubeId: "3VdNChZXwPo",
    clipStartSec: 36,
    clipEndSec: 48,
    credit: "HyperX",
  },
  {
    keyboardId: "hyperx-origins-2-pro-65",
    youtubeId: "YOGrWavrIVc",
    clipStartSec: 12,
    clipEndSec: 24,
    credit: "HyperX",
  },
  {
    keyboardId: "hyperx-origins-2-65",
    youtubeId: "YOGrWavrIVc",
    clipStartSec: 15,
    clipEndSec: 27,
    credit: "HyperX",
  },
  {
    keyboardId: "hyperx-origins-2-1800",
    youtubeId: "YOGrWavrIVc",
    clipStartSec: 28,
    clipEndSec: 40,
    credit: "HyperX",
  },
  {
    keyboardId: "ducky-one-3-rgb-tkl",
    youtubeId: "DPk5BJrexl4",
    clipStartSec: 0,
    clipEndSec: 12,
    credit: "Ducky",
  },
  {
    keyboardId: "ducky-one-3-rgb-full",
    youtubeId: "DPk5BJrexl4",
    clipStartSec: 28,
    clipEndSec: 40,
    credit: "Ducky",
  },
  {
    keyboardId: "ducky-one-3-mini-sf",
    youtubeId: "DPk5BJrexl4",
    clipStartSec: 14,
    clipEndSec: 26,
    credit: "Ducky",
  },
  {
    keyboardId: "nuphy-field75-he",
    youtubeId: "esZyXpwxg-w",
    clipStartSec: 24,
    clipEndSec: 36,
    credit: "NuPhy",
  },
];

const showcaseByKeyboardId = new Map(
  keyboardShowcases.map((entry) => [entry.keyboardId, entry]),
);

export function getKeyboardShowcase(
  keyboardId: string,
): KeyboardShowcase | undefined {
  return showcaseByKeyboardId.get(keyboardId);
}

export function keyboardHasShowcase(keyboardId: string): boolean {
  return showcaseByKeyboardId.has(keyboardId);
}

import type { Keyboard } from "@/types";

export type RankingSort = "speed" | "price-asc" | "price-desc" | "newest";

export interface RankedKeyboard extends Keyboard {
  score: number;
  rank: number;
  scoreBreakdown: SpeedScoreBreakdown;
}

export interface SpeedScoreBreakdown {
  polling: number;
  response: number;
  actuation: number;
  rapidTrigger: number;
  total: number;
}

export const SCORE_WEIGHTS = {
  pollingMax: 30,
  responseMax: 35,
  actuationMax: 25,
  rapidTriggerBonus: 10,
  pollingReferenceHz: 8000,
  responseReferenceMs: 2,
  actuationReferenceMm: 2,
} as const;

export const SCORE_CRITERIA = [
  {
    key: "polling",
    label: "Polling rate",
    maxPoints: SCORE_WEIGHTS.pollingMax,
    description:
      "How often the keyboard reports input to your PC. Higher polling (up to 8,000 Hz) means fresher key state data and lower input latency.",
    formula: "Up to 30 pts — scales linearly to 8,000 Hz (the current high-end standard).",
  },
  {
    key: "response",
    label: "Response time",
    maxPoints: SCORE_WEIGHTS.responseMax,
    description:
      "End-to-end input delay from key press to the PC. Lower milliseconds mean faster registration in competitive games.",
    formula: "Up to 35 pts — lower response time earns more; 2 ms or above earns 0 pts.",
  },
  {
    key: "actuation",
    label: "Actuation point",
    maxPoints: SCORE_WEIGHTS.actuationMax,
    description:
      "How far a key must travel before it registers. Shorter travel registers inputs sooner — critical for FPS and fighting games.",
    formula: "Up to 25 pts — shorter actuation earns more; 2 mm or above earns 0 pts.",
  },
  {
    key: "rapidTrigger",
    label: "Rapid trigger",
    maxPoints: SCORE_WEIGHTS.rapidTriggerBonus,
    description:
      "Lets a key re-fire without fully resetting. Essential for strafing, counter-strafing, and repeated taps in esports.",
    formula: "Flat +10 pts when supported; 0 pts when not available.",
  },
] as const;

export function getSpeedScoreBreakdown(keyboard: Keyboard): SpeedScoreBreakdown {
  const { stats } = keyboard;

  const polling = Math.round(
    (stats.pollingRateHz / SCORE_WEIGHTS.pollingReferenceHz) *
      SCORE_WEIGHTS.pollingMax,
  );
  const response = Math.round(
    Math.max(
      0,
      (1 - stats.responseTimeMs / SCORE_WEIGHTS.responseReferenceMs) *
        SCORE_WEIGHTS.responseMax,
    ),
  );
  const actuation = Math.round(
    Math.max(
      0,
      (1 - stats.actuationPointMm / SCORE_WEIGHTS.actuationReferenceMm) *
        SCORE_WEIGHTS.actuationMax,
    ),
  );
  const rapidTrigger = stats.rapidTrigger ? SCORE_WEIGHTS.rapidTriggerBonus : 0;
  const total = Math.min(
    100,
    polling + response + actuation + rapidTrigger,
  );

  return { polling, response, actuation, rapidTrigger, total };
}

export function computeSpeedScore(keyboard: Keyboard): number {
  return getSpeedScoreBreakdown(keyboard).total;
}

function compareBySpeed(a: Keyboard, b: Keyboard): number {
  const scoreDiff = computeSpeedScore(b) - computeSpeedScore(a);
  if (scoreDiff !== 0) return scoreDiff;

  const responseDiff = a.stats.responseTimeMs - b.stats.responseTimeMs;
  if (responseDiff !== 0) return responseDiff;

  return a.priceUsd - b.priceUsd;
}

export function sortKeyboards(
  keyboards: Keyboard[],
  sort: RankingSort,
): Keyboard[] {
  const sorted = [...keyboards];

  switch (sort) {
    case "speed":
      sorted.sort(compareBySpeed);
      break;
    case "price-asc":
      sorted.sort((a, b) => a.priceUsd - b.priceUsd);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.priceUsd - a.priceUsd);
      break;
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
      );
      break;
  }

  return sorted;
}

export function getRankedKeyboards(
  keyboards: Keyboard[],
  sort: RankingSort = "speed",
): RankedKeyboard[] {
  const sorted = sortKeyboards(keyboards, sort);

  return sorted.map((keyboard, index) => {
    const scoreBreakdown = getSpeedScoreBreakdown(keyboard);

    return {
      ...keyboard,
      score: scoreBreakdown.total,
      scoreBreakdown,
      rank: index + 1,
    };
  });
}

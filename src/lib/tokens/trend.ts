export type ValueTrend = "rising" | "stable" | "dropping";

/** Minimum effective-score delta before a token is labeled rising or dropping. */
export const VALUE_TREND_THRESHOLD = 3;

export function computeValueTrend(
  currentScore: number,
  previousScore: number | undefined,
): ValueTrend {
  if (previousScore === undefined) {
    return "stable";
  }

  if (currentScore > previousScore + VALUE_TREND_THRESHOLD) {
    return "rising";
  }

  if (currentScore < previousScore - VALUE_TREND_THRESHOLD) {
    return "dropping";
  }

  return "stable";
}

export const VALUE_TREND_LABELS: Record<ValueTrend, string> = {
  rising: "Rising",
  stable: "Stable",
  dropping: "Dropping",
};

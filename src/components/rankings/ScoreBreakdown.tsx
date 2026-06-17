import type { SpeedScoreBreakdown } from "@/lib/rankings";
import { SCORE_CRITERIA } from "@/lib/rankings";

interface ScoreBreakdownProps {
  breakdown: SpeedScoreBreakdown;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
        Score breakdown
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SCORE_CRITERIA.map((criterion) => {
          const points =
            breakdown[criterion.key as keyof SpeedScoreBreakdown];
          const width = `${(points / criterion.maxPoints) * 100}%`;

          return (
            <div key={criterion.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="text-text-muted">{criterion.label}</span>
                <span className="font-medium text-text-primary">
                  {points}/{criterion.maxPoints}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green"
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

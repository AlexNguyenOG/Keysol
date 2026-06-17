import { SCORE_CRITERIA } from "@/lib/rankings";

export function SpeedScoreExplainer() {
  return (
    <section className="mb-12 rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
        How speed scores work
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
        Each keyboard earns up to{" "}
        <span className="text-text-primary">100 points</span> from four
        competitive-performance factors. We weight response time and actuation
        most heavily because they directly affect how quickly a press registers
        in-game. Polling rate matters for how fresh that data is, and rapid
        trigger is a flat bonus for esports-oriented features.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {SCORE_CRITERIA.map((criterion) => (
          <div
            key={criterion.key}
            className="rounded-xl border border-white/10 bg-bg-primary/50 p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-medium text-text-primary">{criterion.label}</h3>
              <span className="shrink-0 rounded-full bg-solana-purple/20 px-2.5 py-0.5 text-xs font-semibold text-solana-purple">
                {criterion.maxPoints} pts max
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text-muted">
              {criterion.description}
            </p>
            <p className="mt-2 text-xs text-text-muted/80">{criterion.formula}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-bg-primary/50 p-4">
        <h3 className="font-medium text-text-primary">Why scores tie or cluster</h3>
        <ul className="mt-3 space-y-2 text-sm text-text-muted">
          <li>
            Keyboards with identical polling, response time, actuation, and
            rapid trigger support earn the same score — for example, several
            8,000 Hz hall-effect boards land at 97/100.
          </li>
          <li>
            When scores tie, rank order breaks ties by lower response time, then
            lower price.
          </li>
          <li>
            Wireless boards like the Logitech G Pro X TKL Lightspeed score lower
            on polling (1,000 Hz) even though wireless latency is strong, because
            the formula prioritizes wired high-polling esports specs.
          </li>
          <li>
            Classic mechanical speed switches (e.g. Cherry MX Speed Silver)
            score well on actuation but miss the rapid trigger bonus unless the
            board supports it.
          </li>
        </ul>
      </div>
    </section>
  );
}

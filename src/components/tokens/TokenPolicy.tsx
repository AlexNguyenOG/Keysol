import Link from "next/link";

const policyRules = [
  {
    title: "What a token is",
    body: "A KeySol token is an optional digital collectible tied to one catalog keyboard. It is not required to browse rankings, check stock, or buy a physical board from retailers.",
  },
  {
    title: "One token type per keyboard",
    body: "Each keyboard in the catalog maps to exactly one token symbol (for example KSOL-W60HE). That mapping never changes after mint.",
  },
  {
    title: "Fixed max supply",
    body: "Every token publishes a max supply in the catalog before mint. Supply will not increase after the mint window closes. Mint authority is revoked once the cap is reached.",
  },
  {
    title: "No random mints",
    body: "Collectors choose which keyboard token to mint. There are no loot boxes, blind packs, or wagering on Rising / Dropping trends.",
  },
  {
    title: "Collectible language only",
    body: "Tokens are framed as collectibles and scarcity badges — not investments, not guaranteed returns, and not financial advice. Value Trends reflect retailer stock signals, not profit forecasts.",
  },
  {
    title: "Optional site utility",
    body: "After mint, holders may show wallet badges or collector status. Core KeySol features (catalog, rankings, stock, buy links) stay free for everyone.",
  },
];

const mintSteps = [
  {
    step: "1",
    title: "Devnet first",
    body: "Ship wallet connect + mint on Solana devnet. Confirm holdings, catalog mint addresses, and revoke flows before any mainnet spend.",
  },
  {
    step: "2",
    title: "Publish mint addresses",
    body: "List each on-chain mint address next to its catalog entry so collectors can verify on Solscan against keysol.vercel.app.",
  },
  {
    step: "3",
    title: "Pilot, then expand",
    body: "Mainnet starts with a small pilot (1–2 keyboard tokens). Expand to the full catalog only after the pilot is clean.",
  },
];

const checklist = [
  "SPL mint metadata matches catalog: symbol, name, max supply, keyboard id",
  "Max supply enforced on-chain; mint authority revoked at / after cap",
  "Freeze authority: none, or fully disclosed before mint",
  "Update authority: minimal and documented (or revoked after metadata is final)",
  "Mint UX: clear wallet signing copy — never ask for seed phrases",
  "Official site lists mint addresses before public promotion",
  "Anti-bot / one-per-wallet rules documented if free or limited claims are used",
  "No paywall on rankings, stock, or retailer buy links",
  "No betting, packs, or “invest in Rising boards” mechanics",
  "Legal review before paid mints or secondary royalties (jurisdiction-dependent)",
];

export function TokenPolicy() {
  return (
    <section className="mb-12 space-y-8" aria-labelledby="token-policy-title">
      <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-solana-green">
          Public policy
        </p>
        <h2
          id="token-policy-title"
          className="text-xl font-semibold text-text-primary sm:text-2xl"
        >
          Token policy
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
          These are the rules KeySol intends to follow when on-chain minting
          goes live. The registry and scoring on this site already follow them
          off-chain. Until mint addresses appear in the catalog, nothing here is
          tradable on Solana.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {policyRules.map((rule) => (
            <div
              key={rule.title}
              className="rounded-xl border border-white/10 bg-bg-primary/50 p-4"
            >
              <h3 className="font-medium text-text-primary">{rule.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {rule.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-text-muted">
          Live scarcity movers stay on{" "}
          <Link
            href="/value-trends"
            className="text-solana-green underline-offset-2 hover:underline"
          >
            Value Trends
          </Link>
          ; this policy explains ownership rules, not market timing.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Responsible mint path
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
          A fixed order of operations so collectors can trust the launch.
        </p>

        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {mintSteps.map((item) => (
            <li
              key={item.step}
              className="rounded-xl border border-white/10 bg-bg-primary/50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-solana-purple">
                Step {item.step}
              </p>
              <h3 className="mt-2 font-medium text-text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Devnet technical checklist
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
          Engineering gates before mainnet. Treat every item as required, not
          optional polish.
        </p>

        <ul className="mt-6 space-y-3">
          {checklist.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-white/10 bg-bg-primary/50 px-4 py-3 text-sm text-text-muted"
            >
              <span
                className="mt-0.5 h-4 w-4 shrink-0 rounded border border-solana-green/40 bg-solana-green/10"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium text-amber-200">Not legal advice</p>
          <p className="mt-1 text-amber-100/90">
            Paid mints, royalties, and how you market tokens can trigger
            different rules by country. Get counsel before charging money or
            promising anything beyond a collectible badge.
          </p>
        </div>
      </div>
    </section>
  );
}

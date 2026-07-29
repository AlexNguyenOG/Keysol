"use client";

import { keyboardTokens } from "@/data/keyboard-tokens";
import { getExplorerAddressUrl } from "@/lib/solana/cluster";
import {
  CollectibleWalletConnectButton,
  CollectibleWalletDisconnectButton,
  useTokenCollectibles,
} from "./TokenCollectiblesProvider";

const MAX_PLACEHOLDERS = 12;

export function TokenCollectionBadges() {
  const {
    enabled,
    clusterLabel,
    localTestAllowed,
    wallets,
    wallet,
    activeAddress,
    connected,
    claimable,
    claimedIds,
    claimedCount,
    catalogTotal,
    holdingsLoading,
    error,
    startLocalTestWallet,
    disconnectAll,
  } = useTokenCollectibles();

  if (!enabled) {
    return null;
  }

  const claimed = claimable.filter((token) => token.claimed);
  const total = Math.max(
    catalogTotal,
    claimable.length,
    keyboardTokens.length,
  );
  const progress = total > 0 ? Math.round((claimedCount / total) * 100) : 0;
  const missingPlaceholders = Math.min(
    Math.max(total - claimedCount, 0),
    MAX_PLACEHOLDERS,
  );

  return (
    <section
      aria-labelledby="token-collection-title"
      className="mb-12 rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-solana-green">
        Collection
      </p>
      <h2
        id="token-collection-title"
        className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl"
      >
        Caught {claimedCount}
        <span className="text-text-muted"> / {total}</span>
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
        Connect the wallet you use on{" "}
        <span className="text-text-primary">{clusterLabel}</span> to track your
        keyboard collectibles. Rankings and buy links stay free without holding
        tokens.
      </p>

      <div
        className="collectible-progress mt-5 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={claimedCount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Collection progress"
      >
        <div
          className="collectible-progress-fill h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 space-y-4">
        {connected && activeAddress ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-solana-green">
              {activeAddress.slice(0, 6)}…{activeAddress.slice(-6)}
            </span>
            {wallet ? (
              <CollectibleWalletDisconnectButton wallet={wallet} />
            ) : (
              <button
                type="button"
                onClick={disconnectAll}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Disconnect
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {localTestAllowed && (
              <button
                type="button"
                onClick={() => {
                  void startLocalTestWallet();
                }}
                className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-3 py-2 text-sm font-semibold text-bg-primary"
              >
                Use local test wallet
              </button>
            )}
            {wallets.map((entry) => (
              <CollectibleWalletConnectButton key={entry.name} wallet={entry} />
            ))}
          </div>
        )}

        {holdingsLoading && (
          <p className="text-sm text-text-muted">Loading holdings…</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!holdingsLoading && connected && claimed.length === 0 && (
          <p className="text-sm text-text-muted">
            No claims yet. Pick a card in the dex below and hit Claim.
          </p>
        )}

        <ul className="flex flex-wrap gap-2">
          {claimed.map((token) => (
            <li key={token.keyboardId}>
              {token.mintAddress ? (
                <a
                  href={getExplorerAddressUrl(token.mintAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-solana-green/30 bg-solana-green/10 px-3 py-1.5 font-mono text-sm text-solana-green transition hover:border-solana-green/60"
                  title={`${token.symbol} · balance ${token.onChainAmount ?? 1}`}
                >
                  {token.symbol}
                  <span className="text-[10px] uppercase tracking-wide text-solana-green/80">
                    caught
                  </span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-solana-green/30 bg-solana-green/10 px-3 py-1.5 font-mono text-sm text-solana-green">
                  {token.symbol}
                </span>
              )}
            </li>
          ))}
          {connected
            ? Array.from({ length: missingPlaceholders }).map((_, index) => (
                <li
                  key={`slot-${index}`}
                  className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.02] px-3 font-mono text-xs text-text-muted/50"
                  aria-hidden
                >
                  ···
                </li>
              ))
            : null}
        </ul>

        {/* Keep claimedIds referenced for future filters without lint noise */}
        <span className="sr-only">{claimedIds.size} owned</span>
      </div>
    </section>
  );
}

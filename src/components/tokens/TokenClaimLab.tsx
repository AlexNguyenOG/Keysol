"use client";

import {
  CollectibleWalletConnectButton,
  CollectibleWalletDisconnectButton,
  useTokenCollectibles,
} from "./TokenCollectiblesProvider";

/**
 * Slim wallet + claim status panel. Primary claim UX lives on CollectibleCard.
 */
export function TokenClaimLab() {
  const {
    enabled,
    clusterLabel,
    clusterShort,
    localTestAllowed,
    wallets,
    wallet,
    localSigner,
    activeAddress,
    connected,
    status,
    error,
    lastSignature,
    lastSignatureUrl,
    mintHealthHint,
    startLocalTestWallet,
    disconnectAll,
  } = useTokenCollectibles();

  if (!enabled) {
    return null;
  }

  return (
    <section
      aria-labelledby="token-claim-lab-title"
      className="mb-12 rounded-2xl border border-white/10 bg-bg-surface/60 p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-solana-green">
        Wallet
      </p>
      <h2
        id="token-claim-lab-title"
        className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl"
      >
        Claim status
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
        Connect for{" "}
        <span className="text-text-primary">{clusterLabel}</span>, then claim
        from any card in the dex — one free collectible per keyboard. Prefer a
        card CTA over a dropdown.
      </p>

      {mintHealthHint && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium text-amber-200">Mint health warning</p>
          <p className="mt-1 text-amber-100/90">{mintHealthHint}</p>
          <p className="mt-2 text-amber-100/80">
            With <span className="font-mono">TOKEN_CLAIM_SIMULATION=true</span>,
            claims still work offline (simulated). For real on-chain mints, start
            Surfpool and run{" "}
            <span className="font-mono">npm run tokens:localnet:reset</span>.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-sm text-text-muted">Wallet</p>
          {connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-solana-green">
                {(activeAddress ?? "").slice(0, 6)}…
                {(activeAddress ?? "").slice(-6)}
              </span>
              <span className="text-xs text-text-muted">
                {localSigner?.label ?? wallet?.name ?? "Wallet"} · {clusterShort}
              </span>
              {wallet ? (
                <CollectibleWalletDisconnectButton wallet={wallet} />
              ) : (
                <button
                  type="button"
                  onClick={disconnectAll}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  Disconnect
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {localTestAllowed && (
                <button
                  type="button"
                  onClick={() => {
                    void startLocalTestWallet();
                  }}
                  className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2.5 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90"
                >
                  Use local test wallet (no install)
                </button>
              )}

              {wallets.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-text-muted">
                    Or connect a browser extension:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {wallets.map((entry) => (
                      <CollectibleWalletConnectButton
                        key={entry.name}
                        wallet={entry}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  No extension detected here. That&apos;s normal inside Cursor
                  preview — the local test wallet is enough for Surfpool claims.
                </p>
              )}
            </div>
          )}
        </div>

        {status && <p className="text-sm text-solana-green">{status}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {lastSignature && lastSignatureUrl && (
          <p className="text-sm text-text-muted">
            Tx:{" "}
            <a
              href={lastSignatureUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-solana-green underline-offset-2 hover:underline"
            >
              {lastSignature.slice(0, 12)}…
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

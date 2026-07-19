"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useConnect,
  useDisconnect,
  useWallets,
  type UiWallet,
  type UiWalletAccount,
} from "@wallet-standard/react";
import { getPublicKeyAsync, utils } from "@noble/ed25519";
import bs58 from "bs58";
import { isTokenizationEnabled } from "@/lib/tokens";
import {
  getClusterLabel,
  getExplorerAddressUrl,
  getSolanaCluster,
} from "@/lib/solana/cluster";

interface HoldingToken {
  keyboardId: string;
  symbol: string;
  mintAddress?: string;
  claimed?: boolean;
  onChainAmount?: number;
}

const LOCAL_TEST_WALLET_KEY = "keysol.local-test-wallet.secret";

function isSolanaWallet(wallet: UiWallet): boolean {
  return wallet.chains.some((chain) => chain.startsWith("solana:"));
}

function ConnectButton({
  wallet,
  onConnected,
}: {
  wallet: UiWallet;
  onConnected: (wallet: UiWallet, account: UiWalletAccount) => void;
}) {
  const [connecting, connect] = useConnect(wallet);
  return (
    <button
      type="button"
      disabled={connecting}
      onClick={async () => {
        const accounts = await connect();
        if (accounts[0]) {
          onConnected(wallet, accounts[0]);
        }
      }}
      className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-text-primary hover:border-solana-purple/40 disabled:opacity-60"
    >
      {connecting ? "…" : wallet.name}
    </button>
  );
}

function DisconnectButton({
  wallet,
  onDisconnected,
}: {
  wallet: UiWallet;
  onDisconnected: () => void;
}) {
  const [, disconnect] = useDisconnect(wallet);
  return (
    <button
      type="button"
      onClick={async () => {
        await disconnect();
        onDisconnected();
      }}
      className="text-xs text-text-muted hover:text-text-primary"
    >
      Disconnect
    </button>
  );
}

export function TokenCollectionBadges() {
  const enabled = isTokenizationEnabled();
  const wallets = useWallets().filter(isSolanaWallet);
  const clusterLabel = getClusterLabel();
  const [wallet, setWallet] = useState<UiWallet | null>(null);
  const [account, setAccount] = useState<UiWalletAccount | null>(null);
  const [localAddress, setLocalAddress] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<HoldingToken[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const address = account?.address ?? localAddress;

  const refresh = useCallback(async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tokens/holdings?wallet=${encodeURIComponent(walletAddress)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        error?: string;
        claimable?: HoldingToken[];
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load holdings");
      }
      setHoldings((data.claimable ?? []).filter((token) => token.claimed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load holdings");
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !address) {
      return;
    }
    void refresh(address);
  }, [enabled, address, refresh]);

  if (!enabled) {
    return null;
  }

  async function useLocalWallet() {
    setError(null);
    let secret: Uint8Array;
    const existing = window.sessionStorage.getItem(LOCAL_TEST_WALLET_KEY);
    if (existing) {
      secret = bs58.decode(existing);
    } else {
      secret = utils.randomSecretKey();
      window.sessionStorage.setItem(LOCAL_TEST_WALLET_KEY, bs58.encode(secret));
    }
    const publicKey = await getPublicKeyAsync(secret);
    const next = bs58.encode(publicKey);
    setWallet(null);
    setAccount(null);
    setLocalAddress(next);
  }

  const claimed = holdings;

  return (
    <section
      aria-labelledby="token-collection-title"
      className="mb-12 rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-solana-green">
        Collector status
      </p>
      <h2
        id="token-collection-title"
        className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl"
      >
        Your token badges
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
        Connect the same wallet you used to claim on{" "}
        <span className="text-text-primary">{clusterLabel}</span> to see your
        collectible badges. Catalog, rankings, and buy links stay free without
        holding tokens.
      </p>

      <div className="mt-6 space-y-4">
        {address ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-solana-green">
              {address.slice(0, 6)}…{address.slice(-6)}
            </span>
            {wallet ? (
              <DisconnectButton
                wallet={wallet}
                onDisconnected={() => {
                  setWallet(null);
                  setAccount(null);
                  setHoldings([]);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLocalAddress(null);
                  setHoldings([]);
                }}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Disconnect
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {getSolanaCluster() !== "mainnet-beta" && (
              <button
                type="button"
                onClick={() => {
                  void useLocalWallet();
                }}
                className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-3 py-2 text-sm font-semibold text-bg-primary"
              >
                Use local test wallet
              </button>
            )}
            {wallets.map((entry) => (
              <ConnectButton
                key={entry.name}
                wallet={entry}
                onConnected={(nextWallet, nextAccount) => {
                  setLocalAddress(null);
                  setWallet(nextWallet);
                  setAccount(nextAccount);
                }}
              />
            ))}
          </div>
        )}

        {loading && (
          <p className="text-sm text-text-muted">Loading holdings…</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && address && claimed.length === 0 && (
          <p className="text-sm text-text-muted">
            No claims yet for this wallet. Use the Claim Lab above to mint your
            first collectible.
          </p>
        )}

        {claimed.length > 0 && (
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
                      owned
                    </span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-solana-green/30 bg-solana-green/10 px-3 py-1.5 font-mono text-sm text-solana-green">
                    {token.symbol}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

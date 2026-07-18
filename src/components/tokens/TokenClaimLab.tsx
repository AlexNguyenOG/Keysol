"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useConnect,
  useDisconnect,
  useWallets,
  type UiWallet,
  type UiWalletAccount,
} from "@wallet-standard/react";
import { useSignMessage } from "@solana/react";
import bs58 from "bs58";
import { isTokenizationEnabled } from "@/lib/tokens";
import {
  getClusterLabel,
  getClusterShortLabel,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "@/lib/solana/cluster";

interface ClaimableToken {
  keyboardId: string;
  symbol: string;
  mintAddress?: string;
  maxSupply: number;
  claimed?: boolean;
  onChainAmount?: number;
}

function isSolanaWallet(wallet: UiWallet): boolean {
  return wallet.chains.some((chain) => chain.startsWith("solana:"));
}

function WalletButton({
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
        const account = accounts[0];
        if (account) {
          onConnected(wallet, account);
        }
      }}
      className="rounded-lg border border-white/15 bg-bg-primary/60 px-3 py-2 text-sm text-text-primary transition hover:border-solana-purple/40 disabled:opacity-60"
    >
      {connecting ? "Connecting…" : `Connect ${wallet.name}`}
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
      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
    >
      Disconnect
    </button>
  );
}

function ClaimControls({
  account,
  selected,
  selectedKeyboardId,
  claimable,
  busy,
  onBusy,
  onStatus,
  onError,
  onSignature,
  onClaimed,
  onSelectKeyboard,
}: {
  account: UiWalletAccount;
  selected: ClaimableToken | undefined;
  selectedKeyboardId: string;
  claimable: ClaimableToken[];
  busy: boolean;
  onBusy: (value: boolean) => void;
  onStatus: (value: string | null) => void;
  onError: (value: string | null) => void;
  onSignature: (value: string | null) => void;
  onClaimed: () => Promise<void>;
  onSelectKeyboard: (keyboardId: string) => void;
}) {
  const signMessage = useSignMessage(account);
  const clusterLabel = getClusterLabel();
  const clusterShort = getClusterShortLabel();

  async function claim() {
    if (!selectedKeyboardId) {
      return;
    }

    onBusy(true);
    onError(null);
    onStatus(null);
    onSignature(null);

    try {
      onStatus("Requesting claim challenge…");
      const challengeResponse = await fetch("/api/tokens/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account.address,
          keyboardId: selectedKeyboardId,
        }),
      });
      const challengeData = (await challengeResponse.json()) as {
        error?: string;
        challengeId?: string;
        challenge?: string;
      };
      if (
        !challengeResponse.ok ||
        !challengeData.challengeId ||
        !challengeData.challenge
      ) {
        throw new Error(challengeData.error ?? "Failed to issue claim challenge");
      }

      onStatus("Sign the ownership message in your wallet…");
      const messageBytes = new TextEncoder().encode(challengeData.challenge);
      const { signature } = await signMessage({ message: messageBytes });

      onStatus(`Submitting signed claim on ${clusterShort}…`);
      const response = await fetch("/api/tokens/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account.address,
          keyboardId: selectedKeyboardId,
          challengeId: challengeData.challengeId,
          message: challengeData.challenge,
          signature: bs58.encode(signature),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        signature?: string;
        symbol?: string;
        mintAuthorityRevoked?: boolean;
      };

      if (!response.ok || !data.signature) {
        throw new Error(data.error ?? "Claim failed");
      }

      onSignature(data.signature);
      const revokedNote = data.mintAuthorityRevoked
        ? " Mint authority revoked (max supply reached)."
        : "";
      onStatus(
        data.signature.startsWith("sim-")
          ? `Simulated claim for ${data.symbol} (no on-chain mint yet).${revokedNote}`
          : `Claimed ${data.symbol} on ${clusterLabel}.${revokedNote}`,
      );
      await onClaimed();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Claim failed");
      onStatus(null);
    } finally {
      onBusy(false);
    }
  }

  return (
    <>
      <label className="block text-sm">
        <span className="text-text-muted">Token to claim</span>
        <select
          value={selectedKeyboardId}
          onChange={(event) => onSelectKeyboard(event.target.value)}
          className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary"
        >
          {claimable.length === 0 ? (
            <option value="">No {clusterShort} mints yet — run create script</option>
          ) : (
            claimable.map((token) => (
              <option key={token.keyboardId} value={token.keyboardId}>
                {token.symbol}
                {token.claimed ? " (claimed)" : ""}
                {token.mintAddress ? "" : " (mint missing)"}
              </option>
            ))
          )}
        </select>
      </label>

      {selected?.mintAddress && (
        <p className="text-xs text-text-muted">
          Mint:{" "}
          <a
            href={getExplorerAddressUrl(selected.mintAddress)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-solana-green underline-offset-2 hover:underline"
          >
            {selected.mintAddress.slice(0, 8)}…{selected.mintAddress.slice(-8)}
          </a>
          {typeof selected.onChainAmount === "number" &&
            selected.onChainAmount > 0 && (
              <span className="ml-2">· on-chain balance {selected.onChainAmount}</span>
            )}
        </p>
      )}

      <button
        type="button"
        disabled={
          busy || !selectedKeyboardId || Boolean(selected?.claimed)
        }
        onClick={() => {
          void claim();
        }}
        className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? `Claiming on ${clusterShort}…`
          : selected?.claimed
            ? "Already claimed"
            : "Sign & claim 1 token (free)"}
      </button>
    </>
  );
}

export function TokenClaimLab() {
  const enabled = isTokenizationEnabled();
  const wallets = useWallets().filter(isSolanaWallet);
  const clusterLabel = getClusterLabel();
  const clusterShort = getClusterShortLabel();
  const [wallet, setWallet] = useState<UiWallet | null>(null);
  const [account, setAccount] = useState<UiWalletAccount | null>(null);
  const [claimable, setClaimable] = useState<ClaimableToken[]>([]);
  const [selectedKeyboardId, setSelectedKeyboardId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [apiClusterLabel, setApiClusterLabel] = useState<string | null>(null);

  const refreshHoldings = useCallback(async (walletAddress?: string) => {
    const query = walletAddress
      ? `?wallet=${encodeURIComponent(walletAddress)}`
      : "";
    const response = await fetch(`/api/tokens/holdings${query}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error ?? "Failed to load claimable tokens");
    }

    const data = (await response.json()) as {
      claimable: ClaimableToken[];
      clusterLabel?: string;
    };
    setClaimable(data.claimable);
    if (data.clusterLabel) {
      setApiClusterLabel(data.clusterLabel);
    }
    setSelectedKeyboardId((current) =>
      current || data.claimable[0]?.keyboardId || "",
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    refreshHoldings(account?.address).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load holdings");
    });
  }, [enabled, account?.address, refreshHoldings]);

  const selected = useMemo(
    () => claimable.find((token) => token.keyboardId === selectedKeyboardId),
    [claimable, selectedKeyboardId],
  );

  if (!enabled) {
    return null;
  }

  const displayCluster = apiClusterLabel ?? clusterLabel;

  return (
    <section
      aria-labelledby="token-claim-lab-title"
      className="mb-12 rounded-2xl border border-solana-purple/30 bg-solana-purple/10 p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-solana-green">
        {clusterShort} test lab
      </p>
      <h2
        id="token-claim-lab-title"
        className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl"
      >
        Claim a keyboard collectible
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
        Connect a Solana wallet configured for{" "}
        <span className="text-text-primary">{displayCluster}</span>, then sign a
        one-time ownership message to claim one free token per keyboard. Claims
        are anti-bot protected: the server verifies your wallet signature before
        minting. With real mints this writes an SPL token to your wallet; with
        simulation mode it only records the claim locally.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-sm text-text-muted">Wallet</p>
          {account && wallet ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-solana-green">
                {account.address.slice(0, 6)}…{account.address.slice(-6)}
              </span>
              <DisconnectButton
                wallet={wallet}
                onDisconnected={() => {
                  setWallet(null);
                  setAccount(null);
                }}
              />
            </div>
          ) : wallets.length === 0 ? (
            <p className="text-sm text-text-muted">
              No Solana wallet detected. Install Phantom or Solflare, then
              refresh.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {wallets.map((entry) => (
                <WalletButton
                  key={entry.name}
                  wallet={entry}
                  onConnected={(nextWallet, nextAccount) => {
                    setWallet(nextWallet);
                    setAccount(nextAccount);
                    setError(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {account ? (
          <ClaimControls
            account={account}
            selected={selected}
            selectedKeyboardId={selectedKeyboardId}
            claimable={claimable}
            busy={busy}
            onBusy={setBusy}
            onStatus={setStatus}
            onError={setError}
            onSignature={setLastSignature}
            onClaimed={() => refreshHoldings(account.address)}
            onSelectKeyboard={setSelectedKeyboardId}
          />
        ) : (
          <>
            <label className="block text-sm">
              <span className="text-text-muted">Token to claim</span>
              <select
                value={selectedKeyboardId}
                onChange={(event) => setSelectedKeyboardId(event.target.value)}
                disabled
                className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-text-primary disabled:opacity-60"
              >
                {claimable.length === 0 ? (
                  <option value="">
                    No {clusterShort} mints yet — run create script
                  </option>
                ) : (
                  claimable.map((token) => (
                    <option key={token.keyboardId} value={token.keyboardId}>
                      {token.symbol}
                      {token.mintAddress ? "" : " (mint missing)"}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              disabled
              className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2 text-sm font-semibold text-bg-primary opacity-50"
            >
              Connect a wallet to claim
            </button>
          </>
        )}

        {status && <p className="text-sm text-solana-green">{status}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {lastSignature && (
          <p className="text-sm text-text-muted">
            Tx:{" "}
            <a
              href={getExplorerTxUrl(lastSignature)}
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

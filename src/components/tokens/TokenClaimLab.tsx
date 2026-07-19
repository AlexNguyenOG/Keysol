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
import { getPublicKeyAsync, signAsync, utils } from "@noble/ed25519";
import bs58 from "bs58";
import { isTokenizationEnabled } from "@/lib/tokens";
import {
  getClusterLabel,
  getClusterShortLabel,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  getSolanaCluster,
} from "@/lib/solana/cluster";

interface ClaimableToken {
  keyboardId: string;
  symbol: string;
  mintAddress?: string;
  maxSupply: number;
  claimed?: boolean;
  onChainAmount?: number;
}

interface LabSigner {
  address: string;
  label: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

const LOCAL_TEST_WALLET_KEY = "keysol.local-test-wallet.secret";

function isSolanaWallet(wallet: UiWallet): boolean {
  return wallet.chains.some((chain) => chain.startsWith("solana:"));
}

function allowLocalTestWallet(): boolean {
  return getSolanaCluster() !== "mainnet-beta";
}

async function createOrLoadLocalTestWallet(): Promise<LabSigner> {
  let secret: Uint8Array;
  const existing =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(LOCAL_TEST_WALLET_KEY)
      : null;

  if (existing) {
    secret = bs58.decode(existing);
  } else {
    secret = utils.randomSecretKey();
    window.sessionStorage.setItem(LOCAL_TEST_WALLET_KEY, bs58.encode(secret));
  }

  const publicKey = await getPublicKeyAsync(secret);
  const address = bs58.encode(publicKey);

  return {
    address,
    label: "Local test wallet",
    signMessage: async (message: Uint8Array) => signAsync(message, secret),
  };
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

function DisconnectExtensionButton({
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

function ExtensionClaimControls({
  account,
  ...rest
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
  const signer: LabSigner = {
    address: account.address,
    label: "Extension wallet",
    signMessage: async (message) => {
      const { signature } = await signMessage({ message });
      return signature;
    },
  };

  return <ClaimControls signer={signer} {...rest} />;
}

function ClaimControls({
  signer,
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
  signer: LabSigner;
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
          walletAddress: signer.address,
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

      onStatus("Signing ownership message…");
      const messageBytes = new TextEncoder().encode(challengeData.challenge);
      const signature = await signer.signMessage(messageBytes);

      onStatus(`Submitting signed claim on ${clusterShort}…`);
      const response = await fetch("/api/tokens/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: signer.address,
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
        disabled={busy || !selectedKeyboardId || Boolean(selected?.claimed)}
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
  const localTestAllowed = allowLocalTestWallet();
  const [wallet, setWallet] = useState<UiWallet | null>(null);
  const [extensionAccount, setExtensionAccount] =
    useState<UiWalletAccount | null>(null);
  const [localSigner, setLocalSigner] = useState<LabSigner | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const [claimable, setClaimable] = useState<ClaimableToken[]>([]);
  const [selectedKeyboardId, setSelectedKeyboardId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [apiClusterLabel, setApiClusterLabel] = useState<string | null>(null);
  const [mintHealthHint, setMintHealthHint] = useState<string | null>(null);

  const activeAddress = localSigner?.address ?? extensionAccount?.address;

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

    refreshHoldings(activeAddress).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load holdings");
    });
  }, [enabled, activeAddress, refreshHoldings]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    fetch("/api/tokens/health", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as {
          ok?: boolean;
          recreateHint?: string | null;
          error?: string;
        };
        if (!response.ok || data.ok === false) {
          setMintHealthHint(
            data.recreateHint ??
              data.error ??
              "Mint accounts missing or RPC unreachable.",
          );
          return;
        }
        setMintHealthHint(null);
      })
      .catch(() => {
        setMintHealthHint(
          "Could not reach Solana RPC. For localnet: npm run surfpool:start then npm run tokens:localnet:reset",
        );
      });
  }, [enabled]);

  const selected = useMemo(
    () => claimable.find((token) => token.keyboardId === selectedKeyboardId),
    [claimable, selectedKeyboardId],
  );

  if (!enabled) {
    return null;
  }

  const displayCluster = apiClusterLabel ?? clusterLabel;
  const connected = Boolean(localSigner || extensionAccount);

  async function startLocalTestWallet() {
    setLocalBusy(true);
    setError(null);
    try {
      const signer = await createOrLoadLocalTestWallet();
      setWallet(null);
      setExtensionAccount(null);
      setLocalSigner(signer);
      setStatus(`Using ${signer.label} — no Phantom install needed.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create local test wallet",
      );
    } finally {
      setLocalBusy(false);
    }
  }

  function disconnectAll() {
    setWallet(null);
    setExtensionAccount(null);
    setLocalSigner(null);
    setStatus(null);
    setLastSignature(null);
  }

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
        Connect a wallet for{" "}
        <span className="text-text-primary">{displayCluster}</span>, then sign a
        one-time ownership message to claim one free token per keyboard. If you
        can’t install Phantom (Cursor preview / Safari), use the local test
        wallet below.
      </p>

      {mintHealthHint && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium text-amber-200">Mint health warning</p>
          <p className="mt-1 text-amber-100/90">{mintHealthHint}</p>
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
                {localSigner?.label ?? wallet?.name ?? "Wallet"}
              </span>
              {wallet ? (
                <DisconnectExtensionButton
                  wallet={wallet}
                  onDisconnected={disconnectAll}
                />
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
                  disabled={localBusy}
                  onClick={() => {
                    void startLocalTestWallet();
                  }}
                  className="rounded-lg bg-gradient-to-r from-solana-purple to-solana-green px-4 py-2.5 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {localBusy ? "Creating…" : "Use local test wallet (no install)"}
                </button>
              )}

              {wallets.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-text-muted">
                    Or connect a browser extension:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {wallets.map((entry) => (
                      <WalletButton
                        key={entry.name}
                        wallet={entry}
                        onConnected={(nextWallet, nextAccount) => {
                          setLocalSigner(null);
                          setWallet(nextWallet);
                          setExtensionAccount(nextAccount);
                          setError(null);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  No extension detected here. That’s normal inside Cursor’s
                  preview — the local test wallet is enough for Surfpool claims.
                  For Phantom later, open this page in Chrome.
                </p>
              )}
            </div>
          )}
        </div>

        {localSigner ? (
          <ClaimControls
            signer={localSigner}
            selected={selected}
            selectedKeyboardId={selectedKeyboardId}
            claimable={claimable}
            busy={busy}
            onBusy={setBusy}
            onStatus={setStatus}
            onError={setError}
            onSignature={setLastSignature}
            onClaimed={() => refreshHoldings(localSigner.address)}
            onSelectKeyboard={setSelectedKeyboardId}
          />
        ) : null}

        {extensionAccount ? (
          <ExtensionClaimControls
            account={extensionAccount}
            selected={selected}
            selectedKeyboardId={selectedKeyboardId}
            claimable={claimable}
            busy={busy}
            onBusy={setBusy}
            onStatus={setStatus}
            onError={setError}
            onSignature={setLastSignature}
            onClaimed={() => refreshHoldings(extensionAccount.address)}
            onSelectKeyboard={setSelectedKeyboardId}
          />
        ) : null}

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

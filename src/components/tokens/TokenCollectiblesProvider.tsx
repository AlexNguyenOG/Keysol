"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  getExplorerTxUrl,
  getSolanaCluster,
} from "@/lib/solana/cluster";

export interface ClaimableToken {
  keyboardId: string;
  symbol: string;
  mintAddress?: string;
  maxSupply: number;
  claimed?: boolean;
  onChainAmount?: number;
}

export interface CollectibleSigner {
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

async function createOrLoadLocalTestWallet(): Promise<CollectibleSigner> {
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

interface TokenCollectiblesContextValue {
  enabled: boolean;
  clusterLabel: string;
  clusterShort: string;
  localTestAllowed: boolean;
  wallets: UiWallet[];
  wallet: UiWallet | null;
  extensionAccount: UiWalletAccount | null;
  localSigner: CollectibleSigner | null;
  activeAddress: string | undefined;
  connected: boolean;
  claimable: ClaimableToken[];
  claimedIds: Set<string>;
  catalogTotal: number;
  claimedCount: number;
  holdingsLoading: boolean;
  claimBusyKeyboardId: string | null;
  status: string | null;
  error: string | null;
  lastSignature: string | null;
  lastSignatureUrl: string | null;
  mintHealthHint: string | null;
  connectExtension: (wallet: UiWallet, account: UiWalletAccount) => void;
  startLocalTestWallet: () => Promise<void>;
  disconnectAll: () => void;
  claimToken: (keyboardId: string) => Promise<void>;
  refreshHoldings: () => Promise<void>;
}

const TokenCollectiblesContext =
  createContext<TokenCollectiblesContextValue | null>(null);

async function runClaimPipeline(
  signer: CollectibleSigner,
  keyboardId: string,
  clusterShort: string,
  clusterLabel: string,
): Promise<{ signature: string; symbol?: string; revoked: boolean }> {
  const challengeResponse = await fetch("/api/tokens/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: signer.address,
      keyboardId,
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

  const messageBytes = new TextEncoder().encode(challengeData.challenge);
  const signature = await signer.signMessage(messageBytes);

  const response = await fetch("/api/tokens/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: signer.address,
      keyboardId,
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

  void clusterShort;
  void clusterLabel;

  return {
    signature: data.signature,
    symbol: data.symbol,
    revoked: Boolean(data.mintAuthorityRevoked),
  };
}

function ExtensionClaimExecutor({
  account,
  keyboardId,
  clusterShort,
  clusterLabel,
  onStatus,
  onError,
  onSignature,
  onBusy,
  onDone,
  refreshHoldings,
}: {
  account: UiWalletAccount;
  keyboardId: string;
  clusterShort: string;
  clusterLabel: string;
  onStatus: (value: string | null) => void;
  onError: (value: string | null) => void;
  onSignature: (value: string | null) => void;
  onBusy: (keyboardId: string | null) => void;
  onDone: () => void;
  refreshHoldings: () => Promise<void>;
}) {
  const signMessage = useSignMessage(account);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) {
      return;
    }
    ran.current = true;

    const signer: CollectibleSigner = {
      address: account.address,
      label: "Extension wallet",
      signMessage: async (message) => {
        const { signature } = await signMessage({ message });
        return signature;
      },
    };

    void (async () => {
      onBusy(keyboardId);
      onError(null);
      onStatus(null);
      onSignature(null);
      try {
        onStatus("Requesting claim challenge…");
        onStatus("Signing ownership message…");
        const result = await runClaimPipeline(
          signer,
          keyboardId,
          clusterShort,
          clusterLabel,
        );
        onSignature(result.signature);
        const revokedNote = result.revoked
          ? " Mint authority revoked (max supply reached)."
          : "";
        onStatus(
          result.signature.startsWith("sim-")
            ? `Simulated claim for ${result.symbol} (no on-chain mint yet).${revokedNote}`
            : `Claimed ${result.symbol} on ${clusterLabel}.${revokedNote}`,
        );
        await refreshHoldings();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Claim failed");
        onStatus(null);
      } finally {
        onBusy(null);
        onDone();
      }
    })();
  }, [
    account.address,
    clusterLabel,
    clusterShort,
    keyboardId,
    onBusy,
    onDone,
    onError,
    onSignature,
    onStatus,
    refreshHoldings,
    signMessage,
  ]);

  return null;
}

export function TokenCollectiblesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const enabled = isTokenizationEnabled();
  const wallets = useWallets().filter(isSolanaWallet);
  const clusterLabel = getClusterLabel();
  const clusterShort = getClusterShortLabel();
  const localTestAllowed = allowLocalTestWallet();

  const [wallet, setWallet] = useState<UiWallet | null>(null);
  const [extensionAccount, setExtensionAccount] =
    useState<UiWalletAccount | null>(null);
  const [localSigner, setLocalSigner] = useState<CollectibleSigner | null>(
    null,
  );
  const [claimable, setClaimable] = useState<ClaimableToken[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [claimBusyKeyboardId, setClaimBusyKeyboardId] = useState<string | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [apiClusterLabel, setApiClusterLabel] = useState<string | null>(null);
  const [mintHealthHint, setMintHealthHint] = useState<string | null>(null);
  const [pendingExtensionClaimId, setPendingExtensionClaimId] = useState<
    string | null
  >(null);

  const activeAddress = localSigner?.address ?? extensionAccount?.address;
  const connected = Boolean(localSigner || extensionAccount);
  const displayCluster = apiClusterLabel ?? clusterLabel;

  const refreshHoldings = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setHoldingsLoading(true);
    try {
      const query = activeAddress
        ? `?wallet=${encodeURIComponent(activeAddress)}`
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load holdings");
    } finally {
      setHoldingsLoading(false);
    }
  }, [enabled, activeAddress]);

  useEffect(() => {
    void refreshHoldings();
  }, [refreshHoldings]);

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

  const claimToken = useCallback(
    async (keyboardId: string) => {
      if (localSigner) {
        setClaimBusyKeyboardId(keyboardId);
        setError(null);
        setStatus(null);
        setLastSignature(null);
        try {
          setStatus("Requesting claim challenge…");
          const result = await runClaimPipeline(
            localSigner,
            keyboardId,
            clusterShort,
            displayCluster,
          );
          setLastSignature(result.signature);
          const revokedNote = result.revoked
            ? " Mint authority revoked (max supply reached)."
            : "";
          setStatus(
            result.signature.startsWith("sim-")
              ? `Simulated claim for ${result.symbol} (no on-chain mint yet).${revokedNote}`
              : `Claimed ${result.symbol} on ${displayCluster}.${revokedNote}`,
          );
          await refreshHoldings();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Claim failed");
          setStatus(null);
        } finally {
          setClaimBusyKeyboardId(null);
        }
        return;
      }

      if (extensionAccount) {
        setPendingExtensionClaimId(keyboardId);
        return;
      }

      setError("Connect a wallet first to claim a collectible.");
    },
    [
      clusterShort,
      displayCluster,
      extensionAccount,
      localSigner,
      refreshHoldings,
    ],
  );

  const connectExtension = useCallback(
    (nextWallet: UiWallet, nextAccount: UiWalletAccount) => {
      setLocalSigner(null);
      setWallet(nextWallet);
      setExtensionAccount(nextAccount);
      setError(null);
    },
    [],
  );

  const startLocalTestWallet = useCallback(async () => {
    setError(null);
    try {
      const signer = await createOrLoadLocalTestWallet();
      setWallet(null);
      setExtensionAccount(null);
      setLocalSigner(signer);
      setStatus(`Using ${signer.label} — no Phantom install needed.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create local test wallet",
      );
    }
  }, []);

  const disconnectAll = useCallback(() => {
    setWallet(null);
    setExtensionAccount(null);
    setLocalSigner(null);
    setStatus(null);
    setLastSignature(null);
    setPendingExtensionClaimId(null);
  }, []);

  const claimedIds = useMemo(() => {
    return new Set(
      claimable
        .filter((token) => token.claimed)
        .map((token) => token.keyboardId),
    );
  }, [claimable]);

  const value: TokenCollectiblesContextValue = {
    enabled,
    clusterLabel: displayCluster,
    clusterShort,
    localTestAllowed,
    wallets,
    wallet,
    extensionAccount,
    localSigner,
    activeAddress,
    connected,
    claimable,
    claimedIds,
    catalogTotal: Math.max(claimable.length, 1),
    claimedCount: claimedIds.size,
    holdingsLoading,
    claimBusyKeyboardId,
    status,
    error,
    lastSignature,
    lastSignatureUrl: lastSignature ? getExplorerTxUrl(lastSignature) : null,
    mintHealthHint,
    connectExtension,
    startLocalTestWallet,
    disconnectAll,
    claimToken,
    refreshHoldings,
  };

  return (
    <TokenCollectiblesContext.Provider value={value}>
      {extensionAccount && pendingExtensionClaimId ? (
        <ExtensionClaimExecutor
          account={extensionAccount}
          keyboardId={pendingExtensionClaimId}
          clusterShort={clusterShort}
          clusterLabel={displayCluster}
          onStatus={setStatus}
          onError={setError}
          onSignature={setLastSignature}
          onBusy={setClaimBusyKeyboardId}
          onDone={() => setPendingExtensionClaimId(null)}
          refreshHoldings={refreshHoldings}
        />
      ) : null}
      {children}
    </TokenCollectiblesContext.Provider>
  );
}

export function useTokenCollectibles(): TokenCollectiblesContextValue {
  const ctx = useContext(TokenCollectiblesContext);
  if (!ctx) {
    throw new Error(
      "useTokenCollectibles must be used within TokenCollectiblesProvider",
    );
  }
  return ctx;
}

/** Safe hook when provider may be absent (tokenization off pages). */
export function useTokenCollectiblesOptional(): TokenCollectiblesContextValue | null {
  return useContext(TokenCollectiblesContext);
}

export function CollectibleWalletConnectButton({
  wallet,
}: {
  wallet: UiWallet;
}) {
  const { connectExtension } = useTokenCollectibles();
  const [connecting, connect] = useConnect(wallet);

  return (
    <button
      type="button"
      disabled={connecting}
      onClick={async () => {
        const accounts = await connect();
        if (accounts[0]) {
          connectExtension(wallet, accounts[0]);
        }
      }}
      className="rounded-lg border border-white/15 bg-bg-primary/60 px-3 py-2 text-sm text-text-primary transition hover:border-solana-purple/40 disabled:opacity-60"
    >
      {connecting ? "Connecting…" : `Connect ${wallet.name}`}
    </button>
  );
}

export function CollectibleWalletDisconnectButton({
  wallet,
}: {
  wallet: UiWallet;
}) {
  const { disconnectAll } = useTokenCollectibles();
  const [, disconnect] = useDisconnect(wallet);

  return (
    <button
      type="button"
      onClick={async () => {
        await disconnect();
        disconnectAll();
      }}
      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
    >
      Disconnect
    </button>
  );
}

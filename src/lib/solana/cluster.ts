export type SolanaCluster = "devnet" | "mainnet-beta" | "localnet";

export function getSolanaCluster(): SolanaCluster {
  const value = process.env.NEXT_PUBLIC_SOLANA_CLUSTER?.trim();
  if (value === "mainnet-beta" || value === "localnet") {
    return value;
  }
  return "devnet";
}

export function getSolanaRpcUrl(): string {
  const override = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (override) {
    return override;
  }

  switch (getSolanaCluster()) {
    case "mainnet-beta":
      return "https://api.mainnet-beta.solana.com";
    case "localnet":
      return "http://127.0.0.1:8899";
    default:
      return "https://api.devnet.solana.com";
  }
}

export function getSolanaWsUrl(): string {
  const cluster = getSolanaCluster();
  if (cluster === "localnet") {
    return "ws://127.0.0.1:8900";
  }

  const rpc = getSolanaRpcUrl();
  if (rpc.startsWith("https://")) {
    return rpc.replace("https://", "wss://");
  }
  if (rpc.startsWith("http://")) {
    return rpc.replace("http://", "ws://");
  }
  return "wss://api.devnet.solana.com";
}

export function getClusterLabel(): string {
  switch (getSolanaCluster()) {
    case "localnet":
      return "Surfpool localnet";
    case "mainnet-beta":
      return "Mainnet";
    default:
      return "Devnet";
  }
}

export function getClusterShortLabel(): string {
  switch (getSolanaCluster()) {
    case "localnet":
      return "Localnet";
    case "mainnet-beta":
      return "Mainnet";
    default:
      return "Devnet";
  }
}

export function getExplorerTxUrl(signature: string): string {
  const cluster = getSolanaCluster();
  if (cluster === "localnet") {
    return `https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${encodeURIComponent(getSolanaRpcUrl())}`;
  }
  const clusterQuery =
    cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${clusterQuery}`;
}

export function getExplorerAddressUrl(address: string): string {
  const cluster = getSolanaCluster();
  if (cluster === "localnet") {
    return `https://explorer.solana.com/address/${address}?cluster=custom&customUrl=${encodeURIComponent(getSolanaRpcUrl())}`;
  }
  const clusterQuery =
    cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/address/${address}${clusterQuery}`;
}

export function isDevnetClaimEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_TOKENIZATION_ENABLED === "true" &&
    getSolanaCluster() !== "mainnet-beta"
  );
}

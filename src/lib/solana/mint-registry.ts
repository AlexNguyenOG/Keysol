import type { SolanaCluster } from "@/lib/solana/cluster";

export interface TokenMintRecord {
  keyboardId: string;
  tokenId: string;
  symbol: string;
  mintAddress: string;
  decimals: number;
  createdAt: string;
  /** Off-chain Metaplex JSON URI when available. */
  metadataUri?: string;
}

export interface TokenMintRegistry {
  cluster: SolanaCluster;
  updatedAt: string;
  mintAuthority: string;
  mints: TokenMintRecord[];
}

export function getMintRegistryPath(cluster: SolanaCluster = "devnet"): string {
  return `src/data/token-mints.${cluster === "mainnet-beta" ? "mainnet" : cluster}.json`;
}

/**
 * Create SPL mints for KeySol keyboard tokens (0 decimals) on Devnet or Surfpool localnet.
 * Usage:
 *   npm run tokens:devnet:create
 *   npm run tokens:localnet:create
 * Optional:
 *   TOKEN_MINT_LIMIT=3
 *   TOKEN_MINT_PICK=lowest|highest|first  (default: first)
 *   TOKEN_MINT_INCLUDE_DROPS=true|false   (default: true — also mints published LE drops)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
} from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getInitializeMint2Instruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { keyboardTokens } from "../src/data/keyboard-tokens";
import type { KeyboardToken } from "../src/types";
import type { TokenMintRegistry } from "../src/lib/solana/mint-registry";
import type { SolanaCluster } from "../src/lib/solana/cluster";
import { attachFungibleMetadata } from "./attach-token-metadata";

const CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER?.trim() ||
  "devnet") as SolanaCluster;
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
  (CLUSTER === "localnet"
    ? "http://127.0.0.1:8899"
    : "https://api.devnet.solana.com");
const WS_URL =
  CLUSTER === "localnet"
    ? "ws://127.0.0.1:8900"
    : RPC_URL.replace("https://", "wss://").replace("http://", "ws://");
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://keysol.vercel.app"
).replace(/\/$/, "");
const KEYS_DIR = path.join(process.cwd(), ".keys");
const AUTHORITY_PATH = path.join(KEYS_DIR, "mint-authority.json");
const REGISTRY_PATH = path.join(
  process.cwd(),
  CLUSTER === "localnet"
    ? "src/data/token-mints.localnet.json"
    : "src/data/token-mints.devnet.json",
);
const LIMIT = Number(process.env.TOKEN_MINT_LIMIT ?? "0");
const PICK = (process.env.TOKEN_MINT_PICK?.trim().toLowerCase() ||
  "first") as "first" | "lowest" | "highest";
const INCLUDE_DROPS = process.env.TOKEN_MINT_INCLUDE_DROPS !== "false";
/** Skip on-chain Metaplex attach when program is unavailable (e.g. Surfpool offline). */
const ATTACH_ONCHAIN_METADATA =
  process.env.ATTACH_TOKEN_METADATA !== "false" && CLUSTER !== "localnet";

async function loadPublishedDropTokens(): Promise<KeyboardToken[]> {
  if (!INCLUDE_DROPS) {
    return [];
  }

  try {
    const { listPublishedDrops } = await import("../src/lib/drops/store");
    const drops = await listPublishedDrops();
    return drops.map((drop) => drop.token);
  } catch (error) {
    console.warn(
      "Could not load published drop tokens:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

function selectMintTargets(source: KeyboardToken[]) {
  const sorted =
    PICK === "lowest"
      ? [...source].sort(
          (a, b) =>
            a.rarityScore - b.rarityScore || a.symbol.localeCompare(b.symbol),
        )
      : PICK === "highest"
        ? [...source].sort(
            (a, b) =>
              b.rarityScore - a.rarityScore || a.symbol.localeCompare(b.symbol),
          )
        : [...source];

  return LIMIT > 0 ? sorted.slice(0, LIMIT) : sorted;
}

async function loadOrCreateAuthority() {
  fs.mkdirSync(KEYS_DIR, { recursive: true });

  if (!fs.existsSync(AUTHORITY_PATH)) {
    execFileSync(
      "solana-keygen",
      ["new", "--outfile", AUTHORITY_PATH, "--no-bip39-passphrase", "--force"],
      { stdio: "inherit" },
    );
  }

  const raw = JSON.parse(fs.readFileSync(AUTHORITY_PATH, "utf8")) as number[];
  const signer = await createKeyPairSignerFromBytes(Uint8Array.from(raw));
  console.log(`Mint authority: ${signer.address}`);
  return signer;
}

async function ensureBalance(
  rpc: ReturnType<typeof createSolanaRpc>,
  address: Address,
) {
  const { value } = await rpc.getBalance(address).send();
  if (value >= BigInt(1_500_000_000)) {
    return;
  }

  console.log(`Requesting airdrop for ${address} on ${RPC_URL}...`);
  try {
    await rpc.requestAirdrop(address, BigInt(10_000_000_000)).send();
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.warn(
      "Airdrop failed. Fund manually:",
      address,
      error instanceof Error ? error.message : error,
    );
  }
}

async function main() {
  // Keep off-chain JSON metadata in sync before minting.
  execFileSync("npx", ["tsx", "scripts/write-token-metadata.ts"], {
    stdio: "inherit",
    env: process.env,
  });

  const authority = await loadOrCreateAuthority();
  const authoritySecret = Uint8Array.from(
    JSON.parse(fs.readFileSync(AUTHORITY_PATH, "utf8")) as number[],
  );
  const rpc = createSolanaRpc(RPC_URL);
  const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  await ensureBalance(rpc, authority.address);

  const existing: TokenMintRegistry | null = fs.existsSync(REGISTRY_PATH)
    ? (JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) as TokenMintRegistry)
    : null;

  const byKeyboard = new Map(
    (existing?.mints ?? []).map((mint) => [mint.keyboardId, mint]),
  );

  const dropTokens = await loadPublishedDropTokens();
  const byTokenId = new Map<string, KeyboardToken>();
  for (const token of [...keyboardTokens, ...dropTokens]) {
    byTokenId.set(token.id, token);
  }
  const source = [...byTokenId.values()];
  if (dropTokens.length > 0) {
    console.log(`Including ${dropTokens.length} published limited-edition drop token(s)`);
  }

  const targets = selectMintTargets(source);
  console.log(
    `Mint pick=${PICK}${LIMIT > 0 ? ` limit=${LIMIT}` : ""} → ${targets
      .map((token) => `${token.symbol}(${token.rarityScore})`)
      .join(", ")}`,
  );
  const space = getMintSize();
  const rentLamports = await rpc
    .getMinimumBalanceForRentExemption(BigInt(space))
    .send();

  const funded = await rpc.getBalance(authority.address).send();
  if (funded.value < rentLamports + BigInt(50_000)) {
    throw new Error(
      `Mint authority has insufficient SOL (${funded.value} lamports). Fund ${authority.address} and re-run.`,
    );
  }

  console.log(
    `Creating ${CLUSTER} mints for ${targets.length} tokens (authority ${authority.address})...`,
  );

  for (const token of targets) {
    const already = byKeyboard.get(token.keyboardId);
    if (already) {
      console.log(`skip ${token.symbol} → ${already.mintAddress}`);
      continue;
    }

    const newMint = await generateKeyPairSigner();
    const createIx = getCreateAccountInstruction({
      payer: authority,
      newAccount: newMint,
      lamports: rentLamports,
      space: BigInt(space),
      programAddress: TOKEN_PROGRAM_ADDRESS,
    });
    const initIx = getInitializeMint2Instruction({
      mint: newMint.address,
      decimals: 0,
      mintAuthority: authority.address,
      freezeAuthority: null,
    });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(authority, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions([createIx, initIx], tx),
    );

    const signed = await signTransactionMessageWithSigners(message);
    await sendAndConfirmTransaction(
      signed as Parameters<typeof sendAndConfirmTransaction>[0],
      { commitment: "confirmed" },
    );
    const signature = getSignatureFromTransaction(signed);

    const metadataUri = `${SITE_URL}/tokens/metadata/${token.keyboardId}.json`;
    const record = {
      keyboardId: token.keyboardId,
      tokenId: token.id,
      symbol: token.symbol,
      mintAddress: String(newMint.address),
      decimals: 0,
      createdAt: new Date().toISOString(),
      metadataUri,
    };
    byKeyboard.set(token.keyboardId, record);
    console.log(`ok   ${token.symbol} → ${record.mintAddress} (${signature})`);

    if (ATTACH_ONCHAIN_METADATA) {
      try {
        const metaSig = await attachFungibleMetadata({
          rpcUrl: RPC_URL,
          authoritySecretKey: authoritySecret,
          mintAddress: record.mintAddress,
          name: token.name,
          symbol: token.symbol,
          uri: metadataUri,
          decimals: 0,
        });
        console.log(`meta ${token.symbol} → ${metaSig}`);
      } catch (error) {
        console.warn(
          `meta ${token.symbol} skipped:`,
          error instanceof Error ? error.message : error,
        );
      }
    } else {
      console.log(
        `meta ${token.symbol} off-chain only (${metadataUri}); set ATTACH_TOKEN_METADATA=true to force on-chain`,
      );
    }

    const registry: TokenMintRegistry = {
      cluster: CLUSTER === "localnet" ? "localnet" : "devnet",
      updatedAt: new Date().toISOString(),
      mintAuthority: String(authority.address),
      mints: [...byKeyboard.values()],
    };
    fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\nWrote ${REGISTRY_PATH} (${byKeyboard.size} mints)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

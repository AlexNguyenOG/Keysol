import "server-only";

import {
  address,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getMintToCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { loadMintAuthoritySigner } from "@/lib/solana/authority";
import { getSolanaRpcUrl, getSolanaWsUrl } from "@/lib/solana/cluster";
import { getMintForKeyboard } from "@/lib/solana/mints";
import {
  countClaimsForKeyboard,
  hasClaimedToken,
  recordTokenClaim,
} from "@/lib/solana/claims-store";
import { revokeMintAuthorityWithSigner } from "@/lib/solana/revoke-mint";
import { resolveKeyboardToken } from "@/lib/tokens.server";

export interface ClaimTokenResult {
  ok: true;
  signature: string;
  mintAddress: string;
  keyboardId: string;
  symbol: string;
  simulated?: boolean;
  mintAuthorityRevoked?: boolean;
  revokeSignature?: string;
}

export interface ClaimTokenError {
  ok: false;
  error: string;
  status: number;
}

function isValidBase58Address(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function isSimulationEnabled(): boolean {
  return process.env.TOKEN_CLAIM_SIMULATION === "true";
}

export async function claimDevnetToken(input: {
  walletAddress: string;
  keyboardId: string;
}): Promise<ClaimTokenResult | ClaimTokenError> {
  const walletAddress = input.walletAddress.trim();
  const keyboardId = input.keyboardId.trim();

  if (!isValidBase58Address(walletAddress)) {
    return { ok: false, error: "Invalid wallet address", status: 400 };
  }

  const token = await resolveKeyboardToken(keyboardId);
  if (!token) {
    return { ok: false, error: "Unknown keyboard token", status: 404 };
  }

  const mintRecord = getMintForKeyboard(keyboardId);
  const simulation = isSimulationEnabled() && !mintRecord;

  if (!mintRecord && !simulation) {
    return {
      ok: false,
      error:
        "No mint for this keyboard yet. Run npm run tokens:localnet:create (Surfpool) or tokens:devnet:create.",
      status: 404,
    };
  }

  if (await hasClaimedToken(walletAddress, keyboardId)) {
    return {
      ok: false,
      error: "This wallet already claimed this token (one per wallet)",
      status: 409,
    };
  }

  const minted = await countClaimsForKeyboard(keyboardId);
  if (minted >= token.maxSupply) {
    return {
      ok: false,
      error: `Max supply reached (${token.maxSupply})`,
      status: 409,
    };
  }

  if (simulation) {
    const fakeMint = `Sim${keyboardId}`
      .replace(/[^1-9A-HJ-NP-Za-km-z]/g, "1")
      .slice(0, 32)
      .padEnd(32, "1");
    const signature = `sim-${keyboardId}-${Date.now()}`;
    await recordTokenClaim({
      walletAddress,
      keyboardId,
      mintAddress: fakeMint,
      signature,
      claimedAt: new Date().toISOString(),
    });

    const nextCount = minted + 1;
    return {
      ok: true,
      signature,
      mintAddress: fakeMint,
      keyboardId,
      symbol: token.symbol,
      simulated: true,
      mintAuthorityRevoked: nextCount >= token.maxSupply,
    };
  }

  const authority = await loadMintAuthoritySigner();
  const rpc = createSolanaRpc(getSolanaRpcUrl());
  const rpcSubscriptions = createSolanaRpcSubscriptions(getSolanaWsUrl());
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const mintInfo = await rpc
    .getAccountInfo(address(mintRecord!.mintAddress) as Address, {
      encoding: "base64",
    })
    .send();
  if (!mintInfo.value) {
    return {
      ok: false,
      error:
        "Mint account missing on this Surfpool session (localnet resets wipe state). Run: npm run tokens:localnet:create",
      status: 409,
    };
  }

  const mint = address(mintRecord!.mintAddress) as Address;
  const owner = address(walletAddress) as Address;
  const [ata] = await findAssociatedTokenPda({
    mint,
    owner,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const createAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
    payer: authority,
    owner,
    mint,
  });

  const mintToIx = getMintToCheckedInstruction({
    mint,
    token: ata,
    mintAuthority: authority,
    amount: BigInt(1),
    decimals: mintRecord!.decimals,
  });

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(authority, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions([createAtaIx, mintToIx], tx),
  );

  const signed = await signTransactionMessageWithSigners(message);
  const signature = getSignatureFromTransaction(signed);

  try {
    await sendAndConfirmTransaction(
      signed as Parameters<typeof sendAndConfirmTransaction>[0],
      { commitment: "confirmed" },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      detail.includes("simulation failed")
        ? `${detail}. If Surfpool was restarted, recreate mints with npm run tokens:localnet:create`
        : detail,
    );
  }

  await recordTokenClaim({
    walletAddress,
    keyboardId,
    mintAddress: mintRecord!.mintAddress,
    signature: String(signature),
    claimedAt: new Date().toISOString(),
  });

  const nextCount = minted + 1;
  let mintAuthorityRevoked = false;
  let revokeSignature: string | undefined;

  if (nextCount >= token.maxSupply) {
    try {
      revokeSignature = await revokeMintAuthorityWithSigner(
        mintRecord!.mintAddress,
        authority,
      );
      mintAuthorityRevoked = true;
    } catch (error) {
      console.error("Failed to revoke mint authority after cap", error);
    }
  }

  return {
    ok: true,
    signature: String(signature),
    mintAddress: mintRecord!.mintAddress,
    keyboardId,
    symbol: token.symbol,
    mintAuthorityRevoked,
    revokeSignature,
  };
}

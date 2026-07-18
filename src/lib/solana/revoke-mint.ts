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
  type KeyPairSigner,
} from "@solana/kit";
import {
  AuthorityType,
  getSetAuthorityInstruction,
} from "@solana-program/token";
import { loadMintAuthoritySigner } from "@/lib/solana/authority";
import { getSolanaRpcUrl, getSolanaWsUrl } from "@/lib/solana/cluster";

/** Revoke mint authority so no more tokens can be minted for this mint. */
export async function revokeMintAuthority(mintAddress: string): Promise<string> {
  const authority = await loadMintAuthoritySigner();
  return revokeMintAuthorityWithSigner(mintAddress, authority);
}

export async function revokeMintAuthorityWithSigner(
  mintAddress: string,
  authority: KeyPairSigner,
): Promise<string> {
  const rpc = createSolanaRpc(getSolanaRpcUrl());
  const rpcSubscriptions = createSolanaRpcSubscriptions(getSolanaWsUrl());
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const mint = address(mintAddress) as Address;
  const setAuthorityIx = getSetAuthorityInstruction({
    owned: mint,
    owner: authority,
    authorityType: AuthorityType.MintTokens,
    newAuthority: null,
  });

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(authority, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions([setAuthorityIx], tx),
  );

  const signed = await signTransactionMessageWithSigners(message);
  const signature = getSignatureFromTransaction(signed);
  await sendAndConfirmTransaction(
    signed as Parameters<typeof sendAndConfirmTransaction>[0],
    { commitment: "confirmed" },
  );

  return String(signature);
}

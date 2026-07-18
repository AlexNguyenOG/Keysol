/**
 * Attach Metaplex Token Metadata (Fungible) to an existing mint via Umi.
 * Best-effort: Surfpool offline may not have the metadata program deployed.
 */
import {
  createSignerFromKeypair,
  keypairIdentity,
  publicKey,
  percentAmount,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";

export async function attachFungibleMetadata(input: {
  rpcUrl: string;
  authoritySecretKey: Uint8Array;
  mintAddress: string;
  name: string;
  symbol: string;
  uri: string;
  decimals?: number;
}): Promise<string> {
  const umi = createUmi(input.rpcUrl).use(mplTokenMetadata());
  const keypair = umi.eddsa.createKeypairFromSecretKey(input.authoritySecretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(signer));

  const builder = createV1(umi, {
    mint: publicKey(input.mintAddress),
    authority: signer,
    payer: signer,
    updateAuthority: signer,
    name: input.name.slice(0, 32),
    symbol: input.symbol.slice(0, 10),
    uri: input.uri.slice(0, 200),
    sellerFeeBasisPoints: percentAmount(0),
    decimals: input.decimals ?? 0,
    tokenStandard: TokenStandard.Fungible,
  });

  const result = await builder.sendAndConfirm(umi);
  return Buffer.from(result.signature).toString("base64");
}

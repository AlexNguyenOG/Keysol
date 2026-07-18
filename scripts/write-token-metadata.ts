/**
 * Write off-chain Metaplex-compatible metadata JSON for each KeySol token.
 * Served from /tokens/metadata/{keyboardId}.json
 */
import fs from "node:fs";
import path from "node:path";
import { keyboardTokens } from "../src/data/keyboard-tokens";
import { keyboards } from "../src/data/keyboards";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://keysol.vercel.app"
).replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "public", "tokens", "metadata");

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const token of keyboardTokens) {
    const keyboard = keyboards.find((entry) => entry.id === token.keyboardId);
    const imagePath = keyboard?.image?.startsWith("/")
      ? keyboard.image
      : `/keyboards/${token.keyboardId}.png`;
    const imageUrl = `${SITE_URL}${imagePath}`;

    const metadata = {
      name: token.name,
      symbol: token.symbol,
      description: token.rationale,
      image: imageUrl,
      external_url: `${SITE_URL}/tokens`,
      attributes: [
        { trait_type: "keyboardId", value: token.keyboardId },
        { trait_type: "catalogScore", value: token.rarityScore },
        { trait_type: "maxSupply", value: token.maxSupply },
      ],
      properties: {
        category: "collectible",
        files: [{ uri: imageUrl, type: "image/png" }],
      },
    };

    const outPath = path.join(OUT_DIR, `${token.keyboardId}.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(metadata, null, 2)}\n`);
  }

  console.log(`Wrote ${keyboardTokens.length} metadata files to ${OUT_DIR}`);
}

main();

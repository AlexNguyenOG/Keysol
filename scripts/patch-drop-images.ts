import path from "node:path";

async function main() {
  // Load env from .env.local without printing secrets
  const { readFileSync, existsSync } = await import("node:fs");
  const envPath = path.join(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  const { updatePublishedDropImage, listPublishedDrops } = await import(
    "../src/lib/drops/store"
  );
  const { closeAppDbForTests } = await import("../src/lib/db/app");

  const imageMap: Record<string, string> = {
    "keychron-dayz-special-edition-75-compact":
      "/keyboards/drops/keychron-dayz-special-edition-75-compact.jpg",
    "razer-razer-huntsman-signature-edition":
      "/keyboards/drops/razer-razer-huntsman-signature-edition.jpg",
    "ducky-one-3-rgb-fallout-vault-tec-edition":
      "/keyboards/drops/ducky-one-3-rgb-fallout-vault-tec-edition.jpg",
  };

  for (const [keyboardId, image] of Object.entries(imageMap)) {
    const updated = await updatePublishedDropImage(keyboardId, image);
    console.log(
      updated
        ? `updated ${keyboardId} -> ${image}`
        : `missing ${keyboardId}`,
    );
  }

  const featured = await listPublishedDrops();
  for (const drop of featured) {
    console.log(drop.keyboardId, drop.keyboard.image);
  }

  closeAppDbForTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

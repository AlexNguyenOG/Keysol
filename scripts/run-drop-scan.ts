import { resetAppDbForTests, closeAppDbForTests } from "../src/lib/db/app";
import { scanForDropCandidates } from "../src/lib/drops/detect";
import { listDropCandidates } from "../src/lib/drops/store";

async function main() {
  await resetAppDbForTests("/tmp/keysol-drop-scan-test.db");
  console.log("Scanning...");
  const started = Date.now();
  const result = await scanForDropCandidates();
  console.log(
    JSON.stringify(
      {
        scanned: result.scanned,
        found: result.createdOrUpdated.length,
        ms: Date.now() - started,
        samples: result.createdOrUpdated.slice(0, 12).map((c) => ({
          brand: c.brandId,
          name: c.name,
          confidence: c.confidence,
          signals: c.signals,
          url: c.sourceUrl,
        })),
      },
      null,
      2,
    ),
  );
  console.log("pending:", (await listDropCandidates("pending")).length);
  closeAppDbForTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

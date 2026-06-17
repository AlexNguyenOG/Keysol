import { refreshAvailability } from "../src/lib/availability/checker";

async function main() {
  const availability = await refreshAvailability({ force: true });
  const summary = Object.values(availability).map((record) => ({
    id: record.keyboardId,
    status: record.status,
    checkedAt: record.checkedAt,
    error: record.error,
  }));

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

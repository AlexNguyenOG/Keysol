import { loadEnvLocal, getProjectRoot } from "./load-env-local.mjs";

loadEnvLocal();

const baseUrl = process.env.KEYSOL_BASE_URL ?? "http://localhost:3000";
const secret = process.env.AVAILABILITY_CRON_SECRET;

async function refreshViaApi() {
  if (!secret) {
    throw new Error("AVAILABILITY_CRON_SECRET is not set in .env.local");
  }

  const response = await fetch(`${baseUrl}/api/availability/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Refresh API failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const summary = Object.values(data.availability ?? {}).map((record) => ({
    id: record.keyboardId,
    status: record.status,
    checkedAt: record.checkedAt,
    error: record.error,
  }));

  console.log(
    `[${new Date().toISOString()}] Stock refresh via API (${baseUrl})`,
  );
  console.log(JSON.stringify(summary, null, 2));
}

async function refreshDirect() {
  const { execSync } = await import("node:child_process");
  execSync("npm run availability:refresh", {
    cwd: getProjectRoot(),
    stdio: "inherit",
    env: process.env,
  });
  console.log(`[${new Date().toISOString()}] Stock refresh direct (offline)`);
}

async function isServerUp() {
  try {
    const response = await fetch(`${baseUrl}/api/availability`, {
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (await isServerUp()) {
    await refreshViaApi();
    return;
  }

  console.warn(
    `KeySol API not reachable at ${baseUrl}; refreshing cache directly.`,
  );
  await refreshDirect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

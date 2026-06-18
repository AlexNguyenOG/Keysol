/** @type {import("pm2").StartOptions} */
module.exports = {
  apps: [
    {
      name: "keysol-dev",
      script: "npm",
      args: "run dev",
      cwd: __dirname,
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_restarts: 50,
      min_uptime: "5s",
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "keysol-availability-cron",
      script: "node",
      args: "scripts/availability-cron.mjs",
      cwd: __dirname,
      interpreter: "none",
      autorestart: false,
      watch: false,
      /** Every 6 hours — matches availability cache TTL. */
      cron_restart: "0 */6 * * *",
    },
  ],
};

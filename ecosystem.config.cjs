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
      max_restarts: 100,
      min_uptime: "10s",
      exp_backoff_restart_delay: 2000,
      restart_delay: 3000,
      env: {
        NODE_ENV: "development",
        PORT: "3000",
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

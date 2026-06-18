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
  ],
};

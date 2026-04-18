module.exports = {
  apps: [
    {
      name: "plat3s",
      script: "server.js",
      cwd: "/var/www/plat3s",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/log/pm2/plat3s-error.log",
      out_file: "/var/log/pm2/plat3s-out.log",
      merge_logs: true,
    },
  ],
};

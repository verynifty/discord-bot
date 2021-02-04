module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    // First application
    {
      name: "DiscordBot",
      script: "./index.js",
      watch: true,
      ignore_watch: ["ship-db.js"],
      env: {},
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

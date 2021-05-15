// Run this file to start bot
const Discord = require("discord.js");
const client = new Discord.Client();
path = require("path");
require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env"),
});

const jobPrefifx = "BotRunner: ";
const log = (msg) => {
  const now = new Date();
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

log("Starting bot...");
client.login(process.env.DISCORD);

let _channel;
client.on("ready", () => {
  log("Bot is ready");
  _channel = client.channels.cache.get("817818456446992404");
  log("Channel connected");
  startBot();
});

const startBot = () => {
  log("Starting cron jobs");
  require("./cronjobs/assetsCron").assetsCron.start();
  require("./cronjobs/newPoolsCron").start();
  require("./cronjobs/transfersCron").start();
};
module.exports = {
  getChannel: () => {
    return _channel;
  },
};

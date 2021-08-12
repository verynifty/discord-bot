// Run this file to start bot
const Twitter = require('twitter');
const Discord = require("discord.js");
const client = new Discord.Client();
path = require("path");

require("dotenv").config({ path: path.resolve(process.cwd(), "../.env") });

const jobPrefifx = "BotRunner: ";
const log = (msg) => {
  const now = new Date();
  if (!(typeof msg === "string" || msg instanceof String)) {
    msg = JSON.stringify(msg);
  }
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

log("Starting bot...");
client.login(process.env.DISCORD);
const _twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET,
})

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
  // require("./cronjobs/bonkCron").start(); //uncomment when ready
  require("./cronjobs/soonDeadCron").start(); //uncomment when ready
  require("./cronjobs/twitterTransfersCron").start(); //uncomment when ready
};
module.exports = {
  getChannel: () => {
    return _channel;
  },
  getCudlChannel: () => {
    const cudl_channel = client.channels.cache.get("802629514231545857");
    return cudl_channel;
  },
  getTwitterClient: () => {
    return _twitterClient;
  },
};

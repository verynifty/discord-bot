const axios = require("axios");
const CronJob = require("cron").CronJob;
const Discord = require("discord.js");

const jobPrefifx = "NewBonkEvent: ";
const log = (msg) => {
  const now = new Date();
  if (!(typeof msg === "string" || msg instanceof String)) {
    msg = JSON.stringify(msg);
  }
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

let _channel = require("../BotRunner").getChannel();
let _firstRun = true;
let _etag;
let _totalPools;
// We will store only the pool's address
let _pools = [];
const newPoolsCron = new CronJob({
  cronTime: "* * * * *",
  onTick: async function () {
    let start = new Date();
    log(`Begin Job (Every 30 minutes)`);
    try {
      // do logic to check and send
      _channel.send("test");
    } catch (error) {
      log(error);
    }
    const end = new Date();
    const endTime = Math.abs(start - end);
    log(`End Job (${endTime} ms)`);
  },
  runOnInit: true,
});

module.exports = newPoolsCron;

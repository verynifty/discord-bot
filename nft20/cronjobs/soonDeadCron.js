const axios = require("axios");
const CronJob = require("cron").CronJob;
const Discord = require("discord.js");

const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);
var utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const jobPrefifx = "NewBonkEvent: ";
const log = (msg) => {
  const now = new Date();
  if (!(typeof msg === "string" || msg instanceof String)) {
    msg = JSON.stringify(msg);
  }
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

let _channel = require("../BotRunner").getCudlChannel();

// We will store only the pool's address
let _pools = [];
const soonDeadCron = new CronJob({
  cronTime: "*/30 * * * *", //*/30 * * * *
  onTick: async function () {
    let start = new Date();
    log(`SoonDead Bot Begin Job (Every 1 minutes)`);
    try {
      // do logic to check and send
      const { data } = await axios.get("https://api.nft20.io/cudl/upcoming");

      const upcomingDead = data;

      for (const dead of upcomingDead) {
        const oneHour = 60 * 60 * 1000; /* ms */
        const deadDate = new Date(dead.tod);

        if (deadDate - new Date() <= oneHour) {
          const msg = `Pet #${dead.pet_id} with score ${
            dead.score
          } is starving ${dayjs(deadDate).from(dayjs())} 💀`;

          //   console.log(msg);
          _channel.send(msg);
        }

        // console.log("bonk! ", bonk);
      }
    } catch (error) {
      log(error);
    }
    const end = new Date();
    const endTime = Math.abs(start - end);
    log(`End Job (${endTime} ms)`);
  },
  runOnInit: true,
});

module.exports = soonDeadCron;

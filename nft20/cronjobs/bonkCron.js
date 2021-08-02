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

let _channel = require("../BotRunner").getCudlChannel();

// We will store only the pool's address
let _pools = [];
const bonkCron = new CronJob({
  cronTime: "* * * * *",
  onTick: async function () {
    let start = new Date();
    log(`Bonk Bot Begin Job (Every 1 minutes)`);
    try {
      // do logic to check and send
      const { data } = await axios.get("https://api.nft20.io/cudl/bonks");

      const bonks = data.bonks;
      let lastBonkBlock;
      console.log("lastBonkBlock ", lastBonkBlock);

      if (lastBonkBlock < parseInt(bonks[0].blocknumber)) {
        for (const bonk of bonks) {
          // const oneMinute = 60 * 1000; /* ms */
          // const bonkDate = new Date(bonk.timestamp);

          // if (new Date() - bonkDate <= oneMinute) {
          const msg =
            bonk.attacker == bonk.winner
              ? `#${bonk.attacker} just got BONKED by #${bonk.victim} for ${bonk.reward} $CUDL 🌟🔨`
              : `#${bonk.attacker} tried to attack #${bonk.victim} but got BONKED for ${bonk.reward} $CUDL 🌟🔨`;

          _channel.send(msg);
          // }
        }

        lastBonkBlock = parseInt(bonks[0].blocknumber);

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

module.exports = bonkCron;

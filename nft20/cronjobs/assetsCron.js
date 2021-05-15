const axios = require("axios");
const CronJob = require("cron").CronJob;

const jobPrefifx = "AssetsCronJob: ";
const log = (msg) => {
  const now = new Date();
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

const assetUrl =
  "https://raw.githubusercontent.com/verynifty/nft20-assets/master/assets.json";
let _assets;
const assetsCron = new CronJob({
  cronTime: "0 2 */1 * * *",
  onTick: async function () {
    let start = new Date();
    log(`Begin Job (Every hour on the second minute e.g. 01:02, 2:02, ...)`);
    log("Retrieving assets...");
    try {
      const response = await axios.get(assetUrl);
      _assets = response.data;
    } catch (error) {
      log(error);
    }
    const end = new Date();
    const endTime = Math.abs(start - end);
    log(`End Job (${endTime} ms)`);
  },
  runOnInit: true,
});

module.exports = {
  assetsCron,
  getAssets: () => {
    return _assets;
  },
};

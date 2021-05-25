const axios = require("axios");
const CronJob = require("cron").CronJob;

const jobPrefifx = "AssetsCronJob: ";
const log = (msg) => {
  const now = new Date();
  if (!(typeof msg === "string" || msg instanceof String)) {
    msg = JSON.stringify(msg);
  }
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

const mainnetUrl =
  "https://raw.githubusercontent.com/verynifty/nft20-assets/master/assets.json";
const maticUrl =
  "https://raw.githubusercontent.com/verynifty/nft20-assets/master/assets_matic.json";
let _assets;
const assetsCron = new CronJob({
  cronTime: "0 2 */1 * * *",
  onTick: async function () {
    let start = new Date();
    log(`Begin Job (Every hour on the second minute e.g. 01:02, 2:02, ...)`);
    log("Retrieving assets...");
    try {
      log("Fetching Matic assets");
      const matic = await axios.get(maticUrl);
      log("Fetching Mainnet assets");
      const mainnet = await axios.get(mainnetUrl);

      _assets = mainnet.data.concat(matic.data);
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

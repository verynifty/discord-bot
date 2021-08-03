const axios = require("axios");
const CronJob = require("cron").CronJob;

const jobPrefifx = "TransfersCronJob: ";
const log = (msg) => {
  const now = new Date();
  if (!(typeof msg === "string" || msg instanceof String)) {
    msg = JSON.stringify(msg);
  }
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

let _assets;
const formatMsg = (transfer) => {
  const {
    name,
    symbol,
    transactionhash,
    timestamp,
    pool,
    ids,
    amounts,
    nft_name,
    nft_image,
    type,
  } = transfer;

  const asset = _assets.filter((a) => a.symbol === symbol)[0];
  if (asset == null) {
    log(`There is not an asset for ${name} or the symbols do not match`);
  }
  const { logo, color, uniswap, website } = { ...asset };

  const pool_ = `https://nft20.io/asset/${pool}`;
  const txhash = `TxHash: https://etherscan.io/tx/${transactionhash}`;
  let title = `${name} NFT20 Swap`;
  if (type === 'Withdraw') {
    title = `${ids.length} ${name} NFT20 Bought`;
  } else if (type === 'Depsit') {
    title = `${ids.length} ${name} NFT20 Sold`;
  }
  let desc = '';
  if (type === 'Swap') {
    desc = `Swapped ${nft_name[1]}(${ids[1]}) for ${nft_name[0]}(${ids[0]})`;
  } else {
    if (ids.length > 1) {
      for (let i = 0; i < Math.min(ids.length, 5); i ++) {
        desc += `${i+1}. ${nft_name[i]} (${ids[i]})\n`;
      }
    } else {
      `${nft_name[i]} (${ids[i]})\n`;
    }
  }
  if (ids.length > 5) {
    desc += '...';
  }

  let msg = `${title}:\n${desc}\n${txhash}`;
  if (uniswap) {
    msg += `\nUniswap: ${uniswap}`;
  }
  if (website) {
    msg += `\nNFT Project website: ${website}`;
  }
  msg += `\n${pool_}`;

  // TODO: make sure message is less than 280 charachters
  // Note: links are auto shortned to 23 characters

  return msg;
}

const client = require("../BotRunner.js").getTwitterClient();
const postTransfers = async (transfers) => {
  // Transfers will come in newest to oldest so reverse them for posting
  transfers.reverse();
  // Get latest asset data
  _assets = require("./assetsCron").getAssets();

  for (let i = 0; i < transfers.length; i++) {
    try {
      await client.post(
        'statuses/update',
        {status: formatMsg(transfers[i])}
      )
    } catch (err) {
      log(err)
    }
  }
};

let transefersUrl = "https://api.nft20.io/activity";
const perPage = 100;
let _firstRun = true;
let _etag;
let _lastTimestamp;
const transfersCron = new CronJob({
  cronTime: "0 */5 * * * *",
  onTick: async function () {
    let start = new Date();
    log(`Begin Job (Every 5 minutes)`);
    try {
      let response = await axios.get(transefersUrl, {
        ...(_etag && {
          headers: {
            "If-None-Match": _etag,
          },
        }),
        params: {
          page: 1,
          perPage,
        },
      });
      const {
        data,
        headers: { etag },
      } = response;
      // Save etag to utilize caching
      _etag = etag;

      // Set the last block/time to the first event if the vars are null
      // If the bot is started we do not want to post duplicated transfers
      // Will result in loss of transfer posts if a transfer happens in between
      // bot down time. Could eventually add in a way to start from the right spot.
      if (_lastTimestamp == null) {
        if (_firstRun) {
          log("First Run. Initalizing data...");
          _firstRun = false;
        }
        log("Saved block or timestamp is null, resetting to newest event");
        const { timestamp } = data.data[0];
        _lastTimestamp = new Date(timestamp);
      }

      log(data.data);
      // Our activity variable will hold all data
      let activity = [];

      // Check if we need to paginate (will run once always to add page 1 to activity)
      // We need to paginate if more than 1 page's worths of transactions have occured since last job
      // Repeat check at each page to determine when to stop (dont go through all pages if we don't have to)
      let paging = true;
      let currentPage = data;
      while (paging) {
        const { data, pagination } = currentPage;
        const { currentPage: pageNumber, lastPage } = pagination;
        // Add current page data to activity
        activity.push(...data);

        const oldestEvent = data[data.length - 1];

        const { timestamp: oldestTimestamp } = oldestEvent;

        // Compare last event on page to last stored event to see if we need next page
        if (
          pageNumber >= lastPage ||
          new Date(oldestTimestamp) <= _lastTimestamp
        ) {
          paging = false;
          continue;
        }

        // Get next page
        const nextPage = pageNumber + 1;
        log("Retrieving page ", nextPage);
        const response = await axios.get(transefersUrl, {
          params: {
            page: nextPage,
            perPage,
          },
        });
        currentPage = response.data;
      }

      // Filter events based on block/time since last run
      log(`Last timestamp: ${_lastTimestamp}`);
      activity = activity.filter(({ timestamp }) => {
        const filterTimestamp = new Date(timestamp);
        log(`Filter timestamp: ${filterTimestamp}`);
        return filterTimestamp > _lastTimestamp;
      });

      log(activity);
      if (activity.length > 0) {
        // Update lastest block/time now that we have filtered the data
        const { blocknumber: latestBlockNumber, timestamp: latestTimeStamp } =
          activity[0];
        _lastBlocknumber = latestBlockNumber;
        _lastTimestamp = new Date(latestTimeStamp);

        // We have events to post!
        log(`There are ${activity.length} events to post!`);
        postTransfers(activity);
      } else {
        log("No events after filtering");
      }
    } catch (error) {
      const { response } = error;
      if (response != null) {
        const { status } = response;
        switch (status) {
          case 304:
            log("304: No new data");
            break;
          case 404:
            log("404: Server error");
            break;
          default:
            log("Response Status: ", status);
        }
      } else {
        log(error);
      }
    }
    const end = new Date();
    const endTime = Math.abs(start - end);
    log(`End Job (${endTime} ms)`);
  },
  runOnInit: true,
});

module.exports = transfersCron;

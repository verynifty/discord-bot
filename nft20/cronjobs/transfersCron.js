const axios = require("axios");
const CronJob = require("cron").CronJob;
const Discord = require("discord.js");

const { manageWebhooks } = require("./manageWebhooks");

const jobPrefifx = "TransfersCronJob: ";
const log = (msg) => {
  const now = new Date();
  if (!(typeof msg === "string" || msg instanceof String)) {
    msg = JSON.stringify(msg);
  }
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

let _assets;
const formatMsg = (transfer, offset = 0) => {
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

  let nfts = [];
  let end = offset + 14 > ids.length ? ids.length : offset + 14;
  for (var i = offset; i < end; i++) {
    nfts.push({
      name: "\u200b",
      value: `[**${nft_name[i]}** **${
        amounts[i] < 0 ? `${amounts[i]}` : `+${amounts[i]}`
      }**\n(#${ids[i]})](${nft_image[i]})`,
      inline: true,
    });
  }
  const fields = [
    ...nfts,
    {
      name: "\u200b",
      value: "\u200b",
    },
    {
      name: "\u200b",
      value: `[**TxHash**](https://etherscan.io/tx/${transactionhash})`,
      inline: true,
    },
    {
      name: "\u200b",
      value: `[**NFT20**](https://nft20.io/asset/${pool})`,
      inline: true,
    },
    {
      name: "\u200b",
      value: `[**${symbol}**](https://etherscan.io/token/${pool})`,
      inline: true,
    },
  ];
  if (uniswap) {
    fields.push({
      name: "\u200b",
      value: `[**Uniswap**](${uniswap})`,
      inline: true,
    });
  }
  if (website) {
    fields.push({
      name: "\u200b",
      value: `[**Website**](${website})`,
      inline: true,
    });
  }
  const msgEmbed = new Discord.MessageEmbed()
    .setColor(color ? color : "#ffffff")
    .setAuthor(name, logo, `https://nft20.io/asset/${pool}`)
    .setDescription(
      asset
        ? ""
        : "(Please update [assets.json](https://github.com/verynifty/nft20-assets/blob/master/assets.json) for this asset)"
    )
    .setTitle(`NFT20 ${type}`)
    .setThumbnail(logo)
    .addFields(fields)
    .setTimestamp(timestamp);

  return msgEmbed;
};

let _channel = require("../BotRunner").getChannel();
const postTransfers = (transfers) => {
  // Transfers will come in newest to oldest so reverse them for posting
  transfers.reverse();
  // Get latest asset data
  _assets = require("./assetsCron").getAssets();

  for (var i = 0; i < transfers.length; i++) {
    // Hard limit of 20 fields for discord embeds so transfers with more than 14 nfts
    // will need to be split into multiple posts
    if (transfers[i].ids.length > 14) {
      for (var offset = 0; offset < transfers[i].ids.length; offset += 14) {
        const msgEmbed = formatMsg(transfers[i], offset);

        // uncomment to start running
        manageWebhooks(transfers[i], msgEmbed);

        _channel.send(msgEmbed);
      }
    } else {
      const msgEmbed = formatMsg(transfers[i]);

      // uncomment to start running
      manageWebhooks(transfers[i], msgEmbed);

      _channel.send(msgEmbed);
    }
  }
};

let transefersUrl = "https://api.nft20.io/activity";
const perPage = 100;
let _firstRun = true;
let _etag;
let _lastTimestamp;
const transfersCron = new CronJob({
  cronTime: "0 */2 * * * *",
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

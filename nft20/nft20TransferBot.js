path = require("path");
require("dotenv").config({
  path: path.resolve(process.cwd(), "./example.env"),
});

const axios = require("axios");
const Discord = require("discord.js");
const client = new Discord.Client();

let _assets;
const GetAssets = async () => {
  const response = await axios.get(
    "https://raw.githubusercontent.com/verynifty/nft20-assets/master/assets.json"
  );
  _assets = response.data;
};

// There is a lot of info we have to work with
// Will need to figure out the best format for the messages
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
    console.log(
      `There is not an asset for ${name} or the symbols do not match`
    );
  }
  const { logo, color, uniswap, website } = asset;

  let nfts = [];
  for (var i = 0; i < ids.length; i++) {
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
    .setTitle(`NFT20 ${type}`)
    .setThumbnail(logo)
    .addFields(fields)
    .setTimestamp(timestamp);

  return msgEmbed;
};

let channel;
const postTransfers = (transfers) => {
  //Transfers will come in newest to oldest so reverse them for posting
  transfers.reverse();

  for (var i = 0; i < transfers.length; i++) {
    const msgEmbed = formatMsg(transfers[i]);
    channel.send(msgEmbed);
  }
};

const CronJob = require("cron").CronJob;
const apiUrl = "https://api.nft20.io/activity";
const perPage = 100;
let _etag;
let _lastBlocknumber;
let _lastTimestamp;

const job = new CronJob("0 */5 * * * *", async function () {
  let start = new Date();
  console.log(`Begin Job (Every 5 minutes): ${start}`);
  try {
    let response = await axios.get(apiUrl, {
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
    if (_lastBlocknumber == null || _lastTimestamp == null) {
      console.log(
        "Saved block or timestamp is null, resetting to newest event"
      );
      const { blocknumber, timestamp } = data.data[0];
      _lastBlocknumber = blocknumber;
      _lastTimestamp = new Date(timestamp);
    }

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

      const {
        blocknumber: oldestBlocknumber,
        timestamp: oldestTimestamp,
      } = oldestEvent;

      // Compare last event on page to last stored event to see if we need next page
      if (
        pageNumber >= lastPage ||
        (oldestBlocknumber <= _lastBlocknumber &&
          new Date(oldestTimestamp) <= _lastTimestamp)
      ) {
        paging = false;
        continue;
      }

      // Get next page
      const nextPage = pageNumber + 1;
      console.log("Retrieving page ", nextPage);
      const response = await axios.get(apiUrl, {
        params: {
          page: nextPage,
          perPage,
        },
      });
      currentPage = response.data;
    }
    // Filter events based on block/time since last run
    activity = activity.filter(({ blocknumber, timestamp }) => {
      return (
        blocknumber > _lastBlocknumber && new Date(timestamp) > _lastTimestamp
      );
    });

    if (activity.length > 0) {
      // Update lastest block/time now that we have filtered the data
      const {
        blocknumber: latestBlockNumber,
        timestamp: latestTimeStamp,
      } = activity[0];
      _lastBlocknumber = latestBlockNumber;
      _lastTimestamp = new Date(latestTimeStamp);

      // We have events to post!
      console.log(`There are ${activity.length} events to post!`);
      postTransfers(activity);
    } else {
      console.log("No events after filtering");
    }
  } catch (error) {
    const { response } = error;
    if (response != null) {
      const { status } = response;
      switch (status) {
        case 304:
          console.log("304: No new data");
          break;
        case 404:
          console.log("404: Server error");
          break;
        default:
          console.log("Response Status: ", status);
      }
    } else {
      console.log(error);
    }
  }
  const end = new Date();
  const endTime = Math.abs(start - end);
  console.log(`End Job (${endTime} ms): ${end}`);
});

const job2 = new CronJob("0 2 */1 * * *", async function () {
  let start = new Date();
  console.log(
    `Begin Job (Every hour on the second minute e.g. 01:02, 2:02, ...): ${start}`
  );
  console.log("Retrieving assets...");
  await GetAssets();
  const end = new Date();
  const endTime = Math.abs(start - end);
  console.log(`End Job (${endTime} ms): ${end}`);
});

client.on("ready", () => {
  console.log("Bot is ready");
  channel = client.channels.cache.get("817818456446992404");
  console.log("Channel connected");
});

const startBot = async () => {
  console.log("Starting bot...");
  console.log("Retrieving assets...");
  await GetAssets();
  await client.login(process.env.DISCORD);
  console.log("Starting cron job...");
  job.start();
  job2.start();
};
startBot();

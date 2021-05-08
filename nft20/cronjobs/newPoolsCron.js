const axios = require("axios");
const Discord = require("discord.js");
const client = new Discord.Client();

const jobPrefifx = "NewPoolCronJob: ";
const log = (msg) => {
  const now = new Date();
  console.log(`[${now.toUTCString()}] :: ${jobPrefifx}${msg}`);
};

// There is a lot of info we have to work with
// Will need to figure out the best format for the messages
const formatMsg = (pool) => {
  const { address, name, logo_url } = pool;

  const msgEmbed = new Discord.MessageEmbed()
    .setColor("#fffff")
    .setAuthor(
      name ? name : `Place holder name`,
      logo_url,
      `https://nft20.io/asset/${address}`
    )
    .setDescription(
      logo_url && name
        ? `[Come checkout the asset here](https://nft20.io/asset/${address})`
        : `[Come checkout the asset here](https://nft20.io/asset/${address}) \n
        (Please update [assets.json](https://github.com/verynifty/nft20-assets/blob/master/assets.json) for this asset)`
    )
    .setTitle(`A NEW ASSET HAS BEEN ADDED!`)
    .setThumbnail(logo_url);

  return msgEmbed;
};

const CronJob = require("cron").CronJob;
const poolsUrl = "https://api.nft20.io/pools";
const perPage = 100;
let _etag;
let _totalPools;
// We will store only the pool's address
let _pools = [];

let channel;
client.on("ready", () => {
  log("Bot is ready");
  channel = client.channels.cache.get("813036166852509739");
  log("Channel connected");
});

const newPoolsCron = new CronJob({
  cronTime: "0 */30 * * * *",
  onTick: async function () {
    let start = new Date();
    log(`Begin Job (Every 30 minutes)`);
    try {
      let response = await axios.get(poolsUrl, {
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

      const { total } = data.pagination;

      // First run connect bot, update pool total, and update pools data
      if (_totalPools == null) {
        log("First Run. Initalizing data...");
        log("Starting bot...");
        await client.login(process.env.DISCORD);

        _totalPools = total;
        let paging = true;
        let currentPage = data;
        while (paging) {
          const { data, pagination } = currentPage;
          const { currentPage: pageNumber, lastPage } = pagination;

          // Add current page data to _pools
          _pools.push(...data.map(({ address }) => address));

          if (pageNumber >= lastPage) {
            paging = false;
            continue;
          }

          // Get next page
          const nextPage = pageNumber + 1;
          const response = await axios.get(poolsUrl, {
            params: {
              page: nextPage,
              perPage,
            },
          });
          currentPage = response.data;
        }
      }

      if (_totalPools != total) {
        // We have some new pools to post
        let newPools = [];
        let paging = true;
        let currentPage = data;
        const diff = total - _totalPools;
        while (paging) {
          const { data, pagination } = currentPage;
          const { currentPage: pageNumber, lastPage } = pagination;

          // Update newPools with the pool data for the new pools
          newPools.push(
            data.filter(({ address }) => !_pools.includes(address))
          );
          // Update _pools with new addresses
          _pools.push(...newPools.map(({ address }) => address));

          // Stop paging if on last page or if we have found all the new pools
          if (pageNumber >= lastPage || diff == newPools.length) {
            paging = false;
            continue;
          }

          // Get next page
          const nextPage = pageNumber + 1;
          log(`Retrieving page ${nextPage}`);
          const response = await axios.get(poolsUrl, {
            params: {
              page: nextPage,
              perPage,
            },
          });
          currentPage = response.data;
        }
        _totalPools = total;

        // post new pools
        log(`Posting ${newPools.length} new pool(s)...`);
        console.log(newPools);
        newPools.forEach((pool) => {
          console.log(pool);
          const msgEmbed = formatMsg(pool);
          channel.send(msgEmbed);
        });
      } else {
        log(`No new pools to post`);
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

module.exports = newPoolsCron;

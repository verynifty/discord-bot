path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), "./.env") });

const Discord = require("discord.js");
const client = new Discord.Client();

const { soon, getVnft } = require("./controllers.js");

const BigNumber = require("bignumber.js");

const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);
var utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const JSONdb = require("simple-json-db");
const db = new JSONdb("./ship-db.json");

const command = require("./command");

client.on("ready", () => {
  console.log(`The client is ready!`);

  command(client, "vnft", async (message, args) => {
    vnftId = args[1];
    const vnft = await getVnft(vnftId); // await ctx.reply(data);

    const starvingAt = dayjs(vnft.timeuntilstarving * 1000);
    const todHrsLeft = starvingAt.diff(dayjs(), "hours");

    const tod = !vnft.isdead ? `TOD: ${todHrsLeft} hrs` : `TOD: dead`;

    const expectedReward = new BigNumber(vnft.expectedreward);

    message.channel.send(
      `ID: #${vnft.id} \n` +
        `${tod} \n` +
        `level: ${vnft.level} \n` +
        `Last Mined: ${dayjs(vnft.lasttimemined * 1000).format(
          "D-M HH:mm"
        )} \n` +
        `Score: ${vnft.score} \n` +
        `Current reward: ${expectedReward.shiftedBy(-18).toFixed(2)}muse \n` +
        `HP: ${vnft.hp_lastseen}  \n` +
        `Rarity: ${vnft.rarity}  \n`
    );
  });

  command(client, "fatality", async (message, args) => {
    const msgs = await soon();

    if (msgs.length == 0) {
      message.channel.send("No pets dying soon");
    } else {
      for (msg of msgs) {
        message.channel.send(msg);
      }
    }
  });

  command(client, "soon", async (message, args) => {
    // const giphy = require("giphy-api")({
    //   apiKey: process.env.GIPHY,
    //   https: true,
    // });

    const gifs = [
      "https://media4.giphy.com/media/vccbe85COvN1DjKTti/giphy.gif?cid=ecf05e47rhcxajlcvcyv3rxphb3off7whq5zzjo6286trq8z&rid=giphy.gif&ct=g",
      "https://media0.giphy.com/media/tzHn7A5mohSfe/200w.webp?cid=ecf05e47eoszmf792ko1s4y812h4e2uwe8xsd8autzstuarj&rid=200w.webp&ct=g",
      "https://media4.giphy.com/media/5xtDarzgzG6eu6uVwI0/200w.webp?cid=ecf05e47eoszmf792ko1s4y812h4e2uwe8xsd8autzstuarj&rid=200w.webp&ct=g",
      "https://media4.giphy.com/media/hvS1eKlR75hMr0l7VJ/giphy.webp?cid=ecf05e47eoszmf792ko1s4y812h4e2uwe8xsd8autzstuarj&rid=giphy.webp&ct=g",
      "https://media3.giphy.com/media/5uuRWk7fiXeM0/giphy.webp?cid=ecf05e47eoszmf792ko1s4y812h4e2uwe8xsd8autzstuarj&rid=giphy.webp&ct=g",
      "https://media2.giphy.com/media/H7SaUQ5vEbocJqYZKO/200w.webp?cid=ecf05e47knp1o2tq6399xmbo8iat5olarl4pdom7eixx30at&rid=200w.webp&ct=g",
      "https://media2.giphy.com/media/hoW29qZ2FcaQg/giphy.gif?cid=ecf05e47knp1o2tq6399xmbo8iat5olarl4pdom7eixx30at&rid=giphy.gif&ct=g",
      "https://media4.giphy.com/media/l2Jeb4JPl96GFSAEw/giphy.gif?cid=ecf05e47knp1o2tq6399xmbo8iat5olarl4pdom7eixx30at&rid=giphy.gif&ct=g",
      "",
    ];

    const random = Math.floor(Math.random() * gifs.length);

    // const gif = await giphy.search({ q: "coming soon", rating: "p" });
    message.channel.send(gifs[random]);
  });

  command(client, "fatality", async (message, args) => {
    const msgs = await soon();

    if (msgs.length == 0) {
      message.channel.send("No pets dying soon");
    } else {
      for (msg of msgs) {
        message.channel.send(msg);
      }
    }
  });

  command(client, "enea", async (message, args) => {
    // const gif = await giphy.search({ q: "coming soon", rating: "p" });

    const link =
      "https://tenor.com/view/weird-champ-weird-champ-pogchamp-pog-gif-13780848";
    message.channel.send(link);
  });

  command(client, "countdown", async (message, args) => {
    const now = dayjs().utc().format(); //in utc
    const midnight = dayjs().utc().hour(23).minute(59).format(); //utc
    const result = dayjs(now).to(midnight, true);

    const msg = `🚀  ${result} to show your ships! 🚀 `;

    message.channel.send(msg);
  });

  command(client, "add", async (message, args) => {
    if (message.author.id == 394685599027822593) {
      db.set("ships", message.content);

      message.channel.send("Updated list");
    } else {
      message.channel.send("You can't execute this command");
    }
  });

  command(client, "ships", async (message, args) => {
    // console.log();

    let list = db.get("ships");

    list = list.slice("/add".length).trim();

    const now = dayjs().utc().format(); //in utc
    const midnight = dayjs().utc().hour(23).minute(59).format(); //utc
    const result = dayjs(now).to(midnight, true);

    console.log(list);
    message.channel.send(
      "🎉Today shippers🚀: \n\n" +
        list +
        `\n\n🚔Hurry up or you going to #exile in ${result}🚓`
    );
  });

  command(client, "exile", async (message, args) => {
    if (message.author.id == 394685599027822593) {
      db.set("jail", message.content);

      message.channel.send("Updated list");
    } else {
      message.channel.send("You can't execute this command");
    }
  });

  command(client, "exilelist", async (message, args) => {
    // console.log();

    let list = db.get("jail");

    list = list.slice("/exile".length).trim();

    const now = dayjs().utc().format(); //in utc
    const midnight = dayjs().utc().hour(23).minute(59).format(); //utc
    const result = dayjs(now).to(midnight, true);

    console.log(list);
    message.channel.send(
      `🚔On police watchlist, #exile in ${result}🚔: \n\n` + list
    );
  });

  command(client, "instructions", async (message, args) => {
    // console.log();

    message.channel.send(
      `To be cosidered a shipper you have to ship something until the countdown runs down everyday at midnight UTC.\nYou can ship code, a tweet, content, memes, writing, music. Anything that might get us one step closer to the moon.
      `
    );
  });
});

// // mayb start bot here
// const contracts = require("./contracts");
// const PairABI = require("../abis/Pair.sjon");
// const FactoryABI = require("../abis/Factory.sjon");

client.login(process.env.DISCORD);

path = require("path");
require("dotenv").config({
  path: path.resolve(process.cwd(), "../example.env"),
});

const nft20AbiFactory = require("../abis/Factory");
const nft20AbiFactoryAddress = require("../contracts").Factory;
const nft20AbiPair = require("../abis/Pair");
const Web3 = require("web3");
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    `wss://mainnet.infura.io/ws/v3/${process.env.INFURA}`
  )
);

const factoryInstance = new web3.eth.Contract(
  nft20AbiFactory,
  nft20AbiFactoryAddress
);

const fs = require("fs").promises;
const pairPath = "./nft20/pairData.json";
const BASE_DATA = {
  CREATION_BLOCK: 11023280,
  pairs: [],
  startBlock: 11023280,
};

const UpdatePairData = async () => {
  const jsonString = await fs.readFile(pairPath).catch((err) => {
    err.code === "ENOENT"
      ? console.log("No file found creating new one.")
      : console.error(err);
  });
  let pairData = jsonString ? JSON.parse(jsonString) : BASE_DATA;
  const { pairs, startBlock } = pairData;
  let nft20pairs = (
    await factoryInstance.getPastEvents("pairCreated", {
      fromBlock: startBlock,
      toBlock: "latest",
    })
  ).filter(({ returnValues: { newPair: pairAddress } }) => {
    return !(pairAddress in pairs);
  });
  pairData.startBlock = await web3.eth.getBlockNumber();
  if (nft20pairs.length > 0) {
    await Promise.all(
      nft20pairs.map(async (pair) => {
        const { newPair: pairAddress } = pair.returnValues;
        const pairInstance = new web3.eth.Contract(nft20AbiPair, pairAddress);

        const info = await pairInstance.methods.getInfos().call();
        const { _name, _symbol, _type } = info;
        pairs.push({ _address: pairAddress, _name, _symbol, _type });
      })
    );
    console.log("New pairs added.");
  } else {
    console.log("No new pairs to add.");
  }
  await fs
    .writeFile(pairPath, JSON.stringify(pairData, null, 2))
    .catch((err) => {
      if (err) console.error(err);
    });
};

const GetPairs = async () => {
  const jsonString = await fs.readFile(pairPath).catch((err) => {
    console.error(err);
  });
  return (pairData = jsonString ? JSON.parse(jsonString) : BASE_DATA);
};

const Discord = require("discord.js");
const client = new Discord.Client();

const formatMsg = (transfer) => {
  const {
    transactionHash: txHash,
    returnValues: { from, to, value },
  } = transfer;
  const { _name: coin, _symbol: symbol } = pair;
  const convertedValue = web3.utils.fromWei(value, "ether");
  const { [coin]: extraCoinData } = require("./nft20/pairDataExtra");
  const { color, etherscan, icon, nft20, uniswap } = extraCoinData;
  const msgEmbed = new Discord.MessageEmbed()
    .setColor(color)
    .setAuthor(coin, icon, nft20)
    .setTitle("NFT20 Transfer")
    .setThumbnail(icon)
    .addFields(
      { name: "From: ", value: `${from}` },
      { name: "To: ", value: `${to}` },
      {
        name: "Amount: ",
        value: `${convertedValue.toString()} $${symbol}`,
      },
      {
        name: "\u200b",
        value: `[**TxHash**](https://etherscan.io/search?f=0&q=${txHash})`,
      },
      { name: "\u200b", value: `[NFT20](${nft20})`, inline: true },
      { name: "\u200b", value: `[Token](${etherscan})`, inline: true },
      { name: "\u200b", value: `[Uniswap](${uniswap})`, inline: true }
    )
    .setTimestamp();

  return msgEmbed;
};

const ScanForTransfers = async () => {
  const { pairs } = await GetPairs();
  pairs.forEach((pair) => {
    const { _address } = pair;
    const pairInstance = new web3.eth.Contract(nft20AbiPair, _address);
    pairInstance.events
      .Transfer()
      .on("data", async (transfer) => {
        const msgEmbed = formatMsg(transfer);
        channel.send(msgEmbed);
      })
      .on("error", console.error);
  });
};

const PostPastTransfer = async () => {
  const { pairs } = await GetPairs();
  pair = pairs[3];
  const { _address } = pair;
  const pairInstance = new web3.eth.Contract(nft20AbiPair, _address);

  const pastTransfers = await pairInstance.getPastEvents("Transfer", {
    fromBlock: 11806191,
    toBlock: "latest",
  });
  const channel = client.channels.cache.get("768223073526218803");

  const transfer = pastTransfers[0];
  const msgEmbed = formatMsg(transfer);
  channel.send(msgEmbed);
};

const RunNFT20TransferBot = async () => {
  await UpdatePairData();
  console.log("Update done. Starting transfer scanning");
  await client.login(process.env.DISCORD);
  await PostPastTransfer();
};

RunNFT20TransferBot();

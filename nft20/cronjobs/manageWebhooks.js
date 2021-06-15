const Discord = require("discord.js");

const axios = require("axios");

// this should come from a db
const webhooks = [
  {
    name: "Acclimated MoonCats",
    id: "sampleId",
    token: "samepleToken",
  },
];

exports.manageWebhooks = async (data, msgEmbed) => {
  const result = webhooks.find(({ name }) => name === data.name);

  //   format msg
  const embed = [
    {
      title: `NEW ${data.type.toUpperCase()}`,
      description: `from:  [${data.from}](https://etherscan.io/address/${data.from})\nTo:   [${data.to}](https://etherscan.io/address/${data.to})`,
      url: `https://nft20.io/assets/${0x67bdcd02705cecf08cb296394db7d6ed00a496f9}`,
      color: 5814783,
      fields: [
        {
          name: "TX Hash",
          value: `https://etherscan.io/tx/${data.transactionhash}`,
          inline: true,
        },
        {
          name: "NFT20 Pool",
          value: `https://nft20.io/assets/${data.pool}`,
        },
      ],
      author: {
        name: "NFT20",
        url: "https://nft20.io/",
        icon_url: "https://avatars.githubusercontent.com/u/71987619?s=200&v=4",
      },
      image: {
        url: data.nft_image[0],
      },
      thumbnail: {
        url: data.nft_image[0],
      },
    },
  ];
  if (result) {
    axios.post(
      `https://discord.com/api/webhooks/${result.id}/${result.token}`,
      {
        embeds: embed,
      }
    );
  }
};

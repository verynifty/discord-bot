const Discord = require("discord.js");

// this could come from a db
const webhooks = [
  {
    name: "Acclimated MoonCats",
    id: "854382358185771078",
    token:
      "Nvofqg0J68TYp2u4rzZNlxZK7gLzBQ9kLLdMCGJ0lof2aYq7kJTv1vfKYCDWukDCccgO",
  },
];

exports.manageWebhooks = async (msg) => {
  const result = webhooks.find(({ name }) => name === msg.name);
  console.log("result ", result);

  if (result) {
    const hook = new Discord.WebhookClient(result.id, result.token);

    // Send a message using the webhook
    await hook.send("I am now alive!");
  }
};

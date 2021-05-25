module.exports = (client, aliases, callback) => {
  if (typeof aliases === "string") {
    aliases = [aliases];
  }
  client.on("message", (message) => {
    const { content } = message;
    aliases.forEach((alias) => {
      const command = `!${alias}`;
      const args = content.slice("!".length).trim().split(" ");

      if (content.startsWith(`${command} `) || content === command) {
        // console.log("running command", command);
        // console.log("running args", args);
        callback(message, args);
      }
    });
  });
};

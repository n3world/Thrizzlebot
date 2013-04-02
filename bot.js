// Create the configuration
var config = {
  channels: ["#npnd"],
  server: "irc.freenode.net",
  botName: "ThrizzleBot"
};

// Get the lib
var irc = require("irc");

// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
  channels: config.channels
});

// Listen for joins
bot.addListener("join", function(channel, who) {
  if(who !== config.botName) {
    bot.say(channel, who + " WHATUUUP");   
  }
});

bot.addListener("pm", function(nick, text, message) {
  bot.say(nick, "Imma tweet that");
});
(function () {
  "use strict";

  var irc = require("irc");
  var config = require("./config");
  var _cmds = {}

  // Create the bot name
  var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
  });

  // Listen for joins
  bot.addListener("join", function (channel, who) {
    if (who !== config.botName) {
      bot.say(channel, who + " WHATUUUP");
    }
  });

  /**
   * nick = string. nick of person pm-ing
   * text = string, content of pm
   * message = object, detailed info about user and messsage
   **/
  bot.addListener("pm", function (nick, text, message) {
    var packet = {};
    packet.nick = nick;
    packet.args = text.split(/\s/g);

    var command = packet.args[0];
    packet.args.splice(0, 1);
    if (_cmds[command]) {
      return _cmds[command].run(packet);
    } else {
      bot.say(nick, "I don't know what you're talking about: " + command);
      bot.say(nick, "Commands: " + _cmds);
    }
  });

  // Method to register for pm commands
  // commandClass should implement atleast run(packet) and help
  bot.addPmCommand = function (name, commandClass) {
    _cmds[name] = commandClass;
  }

  // Help command plugin
  bot.addPmCommand("help", function(bot) {
    var _bot = bot;

    function help() {
      return "[<cmd>]";
    }

    function run(packet) {
      var response = "";

      if (packet.args.length > 0) {
        var command = packet.args[0];
        if (_cmds[command]) {
          response += command + " " +_cmds[command].help();
        } else {
          response = "Unknown command: " + command;
        }
      } else {
        response = "Commands:";

        for (var cmd in  _cmds) {
          response += " " + cmd;
        }
      }

      _bot.say(packet.nick, response);
    }

    return {"help":help, "run":run};
  }(bot));

  // Pull in the Seen modules
  require("./plugins/seen").init(bot);
})();

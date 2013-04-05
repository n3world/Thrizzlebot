(function () {
  "use strict";

  var irc = require("irc");
  var config = require("./config");
  var _pmCmds = {};
  var _channelCmds = {};
  var _commandChar = "!";
  var _helpName = "help";

  // Create the bot name
  var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
  });

  // Common help method for help command
  function _help() {
    return "[<cmd>]";
  }

  // Common method for help invocations
  function _helpCommands(_bot, commands, args, target, preface) {
      var response = "";

      if (args.length > 0) {
        var command = args[0];
        if (commands[command]) {
          response += command + " " + commands[command].help();
        } else {
          response = "Unknown command: " + command;
        }
      } else {
        response = "Commands:";

        for (var cmd in  commands) {
          response += " " + cmd;
        }
      }

      _bot.say(target, preface + response);
  }

  // Common method for unknown commands
  function _unknownCommand(bot, commands, command, target, preface) {
     bot.say(target, preface + "Unknown command: " + command);
     _helpCommands(bot, commands, [], target, preface);
  }

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
    if (_pmCmds[command]) {
      return _pmCmds[command].run(packet);
    } else {
      _unknownCommand(bot, _pmCmds, command, nick, "");
    }
  });

  /**
   * Add the listener for channel commands
   */ 
  bot.addListener("message#", function(who, channel, text, packet){
     if (text.charAt(0) == _commandChar) {
       var args = text.split(/\s/g);
       var command = args[0];
       args.splice(0, 1);
       if (_channelCmds[command]) {
         _channelCmds[command].run(who, channel, args, packet);
       } else {
         _unknownCommand(bot, _channelCmds, command, channel, who + ": ");
       }
     }
  });

  // Method to register for channel commands
  // commandClass should implement atleast run(packet) and help
  bot.addChannelCommand = function(name, commandClass) {
    _channelCmds[_commandChar + name] = commandClass;
  }

  // Method to register for pm commands
  // commandClass should implement atleast run(packet) and help
  bot.addPmCommand = function (name, commandClass) {
    _pmCmds[name] = commandClass;
  }

  // Add help plugin for channel commands
  bot.addChannelCommand(_helpName, function(bot) {
    var _bot = bot;

    function run(who, channel, args, packet) {
      _helpCommands(_bot, _channelCmds, args, channel, who + ": ");
    }

    return {"help":_help, "run":run};
  }(bot))

  // Help command plugin for pm
  bot.addPmCommand(_helpName, function(bot) {
    var _bot = bot;

    function run(packet) {
      _helpCommands(_bot, _pmCmds, packet.args, packet.nick, "");
    }

    return {"help":_help, "run":run};
  }(bot));

  // Pull in the Seen modules
  require("./plugins/seen").init(bot);
})();

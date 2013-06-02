function HELP(bot, manager, channel) {
  this.command = "help";
  if (channel === undefined) {
    this.help = "[<channel>] [<cmd>]";
    this.maxArgs = 2;
  } else {
    this.help = "[<cmd>]";
    this.maxArgs = 1;
  }

  this.description = "Retrieve help for commands";

  this._bot = bot;
  this._manager = manager;
  this._channel = channel;
}

/**
 * This displays the help
 * 
 * It is tied heavily to the implementation of plugin_manager so they should
 * change together
 * 
 * @param who
 *            is asking for help
 * @param args
 *            to the help command
 * @param isPm
 *            if it came through a pm
 */
HELP.prototype.run = function(who, args, isPm) {
  var target, preface, cmdChar;
  var extraResponses = [];
  var response = "";
  var commands = this._manager.getCommands();

  if (isPm) {
    target = who;
    preface = "";
    cmdChar = "";
  } else {
    target = this._channel;
    preface = who + ": ";
    cmdChar = this._manager.getCommandChar();
  }

  if (args.length > 0) {
    var command = args[0];
    if (commands[command]) {
      response += cmdChar + command + " " + commands[command].help;
    } else {
      response = "Unknown command: " + command;
    }
  } else {
    response = "Commands: ";

    for ( var cmd in commands) {
      var displayCmd = cmdChar + cmd;
      response += " " + displayCmd;
      if (commands[cmd].description !== undefined) {
        extraResponses.push(displayCmd + " - " + commands[cmd].description);
      }
    }
  }

  this._bot.say(target, preface + response);
  for ( var i in extraResponses) {
    this._bot.say(target, preface + extraResponses[i]);
  }
};

exports.init = function(bot, manager, config, channel) {
  return new HELP(bot, manager, channel);
};

exports.type = [ 'channel', 'global' ];

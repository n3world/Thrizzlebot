var PmOnlyCommandPlugin = require("../lib/thrizzle").PmOnlyCommandPlugin;
var util = require('util');

function HELP(bot, manager, channel) {
  PmOnlyCommandPlugin.call(this, bot, {});
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

util.inherits(HELP, PmOnlyCommandPlugin);

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
 * @param fromPm
 *            if it came through a pm
 */
HELP.prototype.runCommand = function(who, args, toPm, fromPm) {
  var preface, cmdChar;
  var responses = [];
  var response = "";
  var commands = this._manager.getCommands();

  cmdChar = fromPm ? "" : this._manager.getCommandChar(); 
  preface = toPm ? "" : who + ": ";

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
        responses.push(preface + "    " + displayCmd + " - " + commands[cmd].description);
      }
    }
  }

  responses.unshift(response);
  return responses;
};

exports.init = function(bot, manager, config, channel) {
  return new HELP(bot, manager, channel);
};

exports.type = [ 'channel', 'global' ];

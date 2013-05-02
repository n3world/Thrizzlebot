module.exports = (function () {
  "use strict";

  var irc = require("irc");
  var config = require("./config");
  var _pmCmds = {};
  var _channelCmds = {};
  var _commandChar = "!";
  var _helpName = "help";
  var _help = "[<cmd>]";
  var _helpDesc = "Retrieve help for commands";
  var _commandRegex = /^.\w/;
  var _validCommand = /^\w+$/

  // Create the bot name
  var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
  });

  // Common method for help invocations
  function _helpCommands(_bot, commands, args, target, preface) {
      var extraResponses = [];
      var response = "";

      if (args.length > 0) {
        var command = args[0];
        if (commands[command]) {
          response += command + " " + commands[command].help;
        } else {
          response = "Unknown command: " + command;
        }
      } else {
        response = "Commands:";

        for (var cmd in  commands) {
          response += " " + cmd;
          if (commands[cmd].description !== undefined) {
            extraResponses.push(cmd + " - " + commands[cmd].description)
          }
        }
      }

      _bot.say(target, preface + response);
      for (var i in extraResponses) {
        _bot.say(target, preface + extraResponses[i]);
      }
  }

  // Common method for unknown commands
  function _unknownCommand(bot, commands, command, target, preface) {
     bot.say(target, preface + "Unknown command: " + command);
     _helpCommands(bot, commands, [], target, preface);
  }

  // validate that the number of arguments are within the expected range
  function _checkCommandArgs(bot, target, name, command, args, preface) {
    var errMsg;
    if (command.minArgs !== undefined && command.minArgs > args.length) {
      errMsg = "Too few arguments";
    }
    if (command.maxArgs !== undefined && command.maxArgs < args.length) {
      errMsg = "Too many arguments";
    }
    if (errMsg !== undefined) {
      bot.say(target, preface + errMsg);
      bot.say(target, preface + name + " " + command.help);
      return false;
    }
    return true;
  }

  // Check to see if the command exists and has valid arguments
  function _isGoodCommand(bot, target, cmd, commands, args, preface) {
    if (commands[cmd] !== undefined) {
      return _checkCommandArgs(bot, target, cmd, commands[cmd], args, preface);
    }
    _unknownCommand(bot, commands, cmd, target, preface);
    return false;
  }

  // Parse command and args out of a message
  function _parseCommand(text) {
    var args = [],
        regex = /'((\\'|[^'])*)'|"((\\"|[^"])*)"|(\\ |[^ ])+|[\w-]+/g,
        match,
        command,
        isCommand = true,
        arg;

    while (match = regex.exec(text)) {
      if (match[1] !== undefined) {
        arg = match[1];
      } else if (match[3] !== undefined) {
        arg = match[3];
      } else {
        arg = match[0];
      }
      if (isCommand) {
        command = arg;
        isCommand = false;
      } else {
        args.push(arg);
      }
    }

    return {command: command, args: args};
  }

  /**
   * nick = string. nick of person pm-ing
   * text = string, content of pm
   * message = object, detailed info about user and messsage
   **/
  bot.addListener("pm", function (nick, text, message) {
    var packet = {};
    var parsedCmd = _parseCommand(text);
    var command = parsedCmd.command;

    packet.args = parsedCmd.args;
    packet.nick = nick;
    
    if (_isGoodCommand(bot, nick, command, _pmCmds, packet.args, "")) {
      return _pmCmds[command].run(packet);
    }
  });

  /**
   * Add the listener for channel commands
   */ 
  bot.addListener("message#", function(who, channel, text, packet){
    if (text.charAt(0) == _commandChar) {
      if (!_commandRegex.test(text)) {
        // this isn't really a command so ignore it
        return;
      }
      var parsedCmd = _parseCommand(text);
      var command = parsedCmd.command;
      var args = parsedCmd.args;

      if (_isGoodCommand(bot, channel, command, _channelCmds, args, who + ": ")) {
        _channelCmds[command].run(who, channel, args, packet);
      }
    }
  });

  function _validateCommandName(name) {
    if (!_validCommand.test(name)) {
      throw "Invalid command name: " + name;
    }
  }

  /*
   * All commandClasses have the same interface
   * required:
   *   run - function - execute the command
   *   help - string - to display for help
   * optional:
   *   minArgs - int - the minimum number of args the command requires
   *   maxArgs - int - the maximum number of args the command allows
   *   description - string - summary of what the command does
   */

  // Method to register for channel commands
  // commandClass should implement at least run(packet) and help
  bot.addChannelCommand = function(name, commandClass) {
    _validateCommandName(name);
    _channelCmds[_commandChar + name] = commandClass;
  }

  // Method to register for pm commands
  // commandClass should implement at least run(packet) and help
  bot.addPmCommand = function (name, commandClass) {
    _validateCommandName(name);
    _pmCmds[name] = commandClass;
  }

  // Add help plugin for channel commands
  bot.addChannelCommand(_helpName, function(bot) {
    var _bot = bot;

    function run(who, channel, args, packet) {
      _helpCommands(_bot, _channelCmds, args, channel, who + ": ");
    }

    return {"help":_help, "run":run, description: _helpDesc, maxArgs: 1};
  }(bot))

  // Help command plugin for pm
  bot.addPmCommand(_helpName, function(bot) {
    var _bot = bot;

    function run(packet) {
      _helpCommands(_bot, _pmCmds, packet.args, packet.nick, "");
    }

    return {"help":_help, "run":run, description: _helpDesc, maxArgs: 1};
  }(bot));

  // Load a single plugin
  function loadPlugin(pluginDir, name, config) {
    // Grab the plugin specific config
    var pluginConfig = config[name];
    console.log("Loading plugin: " + name);

    try {
      require(pluginDir + "/" + name).init(bot, pluginConfig);
    } catch(err) {
      if (config.haltOnLoadFailure) {
        throw err;
      } else {
        console.error("Failed to load plugin " + name + ": " + err);
      }
    }
  }

  function _isPluginDisabled(name, config) {
    if (config.disable && config.disable.indexOf(name) >= 0)
      return true;
    return false;
  }

  // Pull in the plugins
  function loadPlugins(config) {
    var _jsExt = ".js";
    var pluginDir;
    // see if we have config for thie plugin
    if (config["dir"]) {
      pluginDir = config["dir"];
    } else {
      pluginDir = __dirname + "/plugins";
    }

    var fs = require("fs");

    // If plugins dir is a directory load all plugins found there
    var stat = fs.statSync(pluginDir);
    if (stat.isDirectory()) {
      console.log("Loading plugins");

      var entries = fs.readdirSync(pluginDir);
      for (var i = 0; i < entries.length; ++i) {
        var entry = entries[i];
        if (entry.length > 3 && entry.substring(entry.length - 3, entry.length) == _jsExt) {
          var pluginName = entry.substring(0, entry.length - _jsExt.length);
          if (_isPluginDisabled(pluginName, config)) {
            console.info("Plugin disabled: " + pluginName);
          } else {
            loadPlugin(pluginDir, pluginName, config);
          }
        }
      }
      console.log("Plugin loading done");
    } else {
      console.warn("Plugin directory is not a directory: " + pluginDir);
    }
  }

  // Only load the plugins if we have something in the config
  if (config.plugins) {
    loadPlugins(config.plugins);
  }
})();

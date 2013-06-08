var commandNameParser = require("./input_parsers").commandNameParser;
var ModeTracker = require("./mode_tracker").ModeTracker;
var util = require("util");

/**
 * Base class for plugin managers
 * 
 * @param bot
 * @param config
 *            for the manager
 * @param pluginMap
 *            contains all plugins which this manager can use
 * @param type
 *            of plugins to start. ie global or channel
 * @param channel
 *            which this manage is bound to if any at all
 */
function PluginManagerBase(bot, config, pluginMap, type, channel, cmdChar) {
  this._bot = bot;
  this._config = config;
  this._pluginMap = pluginMap;
  this._type = type;
  this._channel = channel;

  this._commands = {};
  this._plugins = {};
  this._commandChar = cmdChar ? cmdChar : "";
  this._commandRegex = new RegExp("^" + this._commandChar + "\\w");
}

/**
 * Add a new plugin to the class
 */
PluginManagerBase.prototype.startPlugins = function() {
  for (name in this._pluginMap.getPlugins()) {
    if (this._shouldStartPlugin(name)) {
      this._startPlugin(name);
    }
  }
};

/**
 * Starts a new plugin and registers it if it is a command
 * 
 * @param name
 *            of the plugin
 */
PluginManagerBase.prototype._startPlugin = function(name) {
  console.log("Starting plugin " + name + " in " + this._channel);
  var plugin =
      this._pluginMap.getPlugin(name).init(this._bot, this, this._config[name], this._channel);
  this._plugins[name] = plugin;

  if (plugin.command !== undefined) {
    this._commands[commandNameParser(plugin.command)] = plugin;
  }
};

PluginManagerBase.prototype._shouldStartPlugin = function(name) {
  return this._config[name] !== false
      && this._pluginMap.getPlugin(name).type.indexOf(this._type) !== -1;
};

/**
 * 
 * @returns An object of name of plugin to plugin instance
 */
PluginManagerBase.prototype.getPlugins = function() {
  return this._plugins;
};

/**
 * 
 * @returns An object of command to plugin instance
 */
PluginManagerBase.prototype.getCommands = function() {
  return this._commands;
};

/**
 * 
 * @returns All of the plugins the manager has access to
 */
PluginManagerBase.prototype.getPluginMap = function() {
  return this._pluginMap;
};

/**
 * Disable a plugin
 * 
 * @param name
 *            of plugin
 */
PluginManagerBase.prototype.disablePlugin = function(name) {
  var plugin = this._plugins[name];
  if (plugin !== undefined) {
    console.log("Stopping plugin " + name + " in " + this._channel);
    delete this._plugins[name];
    if (plugin.command !== undefined) {
      delete this._commands[plugin.command];
    }
    return true;
  }
  return false;
};

/**
 * Enable a plugin
 * 
 * @param name
 *            of plugin
 */
PluginManagerBase.prototype.enablePlugin = function(name) {
  if (this._plugins[name] === undefined) {
    this._startPlugin(name);
  }
};

/**
 * 
 * @returns The characters used by non pm commands for this manager
 */
PluginManagerBase.prototype.getCommandChar = function() {
  return this._commandChar;
};

/**
 * Run a command
 * 
 * @param commandName
 *            name of the command
 * @param who
 *            Nick who is calling the command
 * @param args
 *            arguments to the command
 * @param isPm
 *            if the command was sent through a pm
 */
PluginManagerBase.prototype.runCommand = function(commandName, who, args, isPm) {
  var target = isPm ? who : this._channel;
  var preface = isPm ? "" : who + ": ";
  var command = this._commands[commandName];

  if (command === undefined) {
    this._bot.say(target, preface + "Unknown command: " + commandName);
    if (this._plugins["help"] !== undefined) {
      this._plugins["help"].run(who, [], isPm);
    }
  } else if (this._checkCommandArgs(target, commandName, command, args, preface)) {
    try {
      command.run(who, args, isPm);
    } catch (e) {
      this._bot.say(target, preface + "Error executing command: " + commandName);
    }
  }
};

/**
 * validate that the number of arguments are within the expected range
 */
PluginManagerBase.prototype._checkCommandArgs = function(target, name, command, args, preface) {
  var errMsg = undefined;
  if (command.minArgs !== undefined && command.minArgs > args.length) {
    errMsg = "Too few arguments";
  }
  if (command.maxArgs !== undefined && command.maxArgs < args.length) {
    errMsg = "Too many arguments";
  }
  if (errMsg !== undefined) {
    this._bot.say(target, preface + errMsg);
    this._bot.say(target, preface + name + " " + command.help);
    return false;
  }
  return true;
};

/**
 * Parse a command
 * 
 * @param text
 *            to be parsed into a command
 * @returns an object with variables command and args
 */
PluginManagerBase.prototype._parseCommand = function(text) {
  var args = [], regex = /'((\\'|[^'])*)'|"((\\"|[^"])*)"|(\\ |[^ ])+|[\w-]+/g, match, command =
      undefined, isCommand = true, arg;

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

  return {
    command : command,
    args : args
  };
};

function isObject(obj) {
  return typeof (obj) == 'object';
}

function mergeDicts(dest, base, extender) {
  for ( var key in base) {
    dest[key] = base[key];
    if (extender !== undefined && extender[key] !== undefined) {
      if (isObject(base[key]) && isObject(extender[key])) {
        mergeDicts(dest[key], base[key], extender[key]);
      } else {
        dest[key] = extender[key];
      }
    }
  }

  for (key in extender) {
    if (dest[key] === undefined) {
      dest[key] = extender[key];
    }
  }
}

/**
 * A map of name to uninitialized plugin object
 */
function PluginMap() {
  this._plugins = {};
}

PluginMap.prototype.addPlugin = function(name, plugin) {
  this._plugins[name] = plugin;
};

PluginMap.prototype.getPlugin = function(name) {
  return this._plugins[name];
};

PluginMap.prototype.getPlugins = function(name) {
  return this._plugins;
};

/**
 * Root plugin manager for the bot
 * 
 */
function PluginManager(bot, config, pluginMap) {
  PluginManagerBase.call(this, bot, config, pluginMap, 'global');
  this._channelPlugins = {};

  this._messageListeners = {};
}

util.inherits(PluginManager, PluginManagerBase);

/**
 * Register all listeners and start the plugins
 */
PluginManager.prototype.start = function() {
  var _this = this;
  function callHandler(type, channel) {
    if (_this._channelPlugins[channel] !== undefined) {
      var args = Array.prototype.splice.call(arguments, 2);
      try {
        _this._channelPlugins[channel].handler(type, args);
      } catch (e) {
        console.log("Handler failed: " + e);
      }
    }
  }

  this._bot.addListener("message#", function(who, channel, text, message) {
    callHandler("message", channel, who, text, message);
  });

  this._bot.addListener("join", function(channel, who, message) {
    callHandler("join", channel, who, message);
  });

  this._bot.addListener("kick", function(channel, who, by, reason, message) {
    callHandler("kick", channel, who, by, reason, message);
  });

  this._bot.addListener("part", function(channel, who, reason, message) {
    callHandler("part", channel, who, reason, message);
  });

  this._bot.addListener("+mode", function(channel, who, mode, modeArgs, message) {
    callHandler("addMode", channel, who, mode, modeArgs, message);
  });

  this._bot.addListener("-mode", function(channel, who, mode, modeArgs, message) {
    callHandler("subMode", channel, who, mode, modeArgs, message);
  });

  this._bot.addListener("nick", function(oldNick, newNick, channels, message) {
    for ( var i in channels) {
      callHandler("nick", channels[i], oldNick, newNick, message);
    }
  });

  // Handle a pm. If the first argument looks like a channel treat it as such
  this._bot.addListener("pm", function(who, text, message) {
    var cmd = _this._parseCommand(text);
    if (cmd.args.length > 0 && /^#[\w\-]+$/.test(cmd.args[0])) {
      channel = cmd.args.shift();
      if (_this._channelPlugins[channel] !== undefined) {
        _this._channelPlugins[channel].runCommand(cmd.command, who, cmd.args, true);
      } else {
        _this._bot.say(who, "Unknown channel " + channel);
      }
    } else {
      _this.runCommand(cmd.command, who, cmd.args, true);
    }
  });

  this.startPlugins();
};

/**
 * Create a new manager for a channel
 * 
 * @param channel
 *            the plugin manager will be bound to 
 */
PluginManager.prototype.createManager = function(channel) {
  var channelConfig = {};
  var extendedConfig = undefined;
  if (this._config.channels !== undefined) {
    extendedConfig = this._config.channels[channel];
  }
  mergeDicts(channelConfig, this._config, extendedConfig);
  channelConfig.channels = undefined;

  var channelManager = new ChannelPluginManager(this, channelConfig, channel);
  this._channelPlugins[channel] = channelManager;
  return channelManager;
};

/**
 * Manager for an individual channels plugins
 * 
 */
function ChannelPluginManager(manager, config, channel) {
  var commandChar = config.commandChar ? config.commandChar : "!";
  PluginManagerBase.call(this, manager._bot, config, manager._pluginMap, 'channel', channel,
      commandChar);
  this._manager = manager;

  this._modeTracker = new ModeTracker(manager._bot, channel);
  this._plugins["__modeTracker"] = this._modeTracker;
}

util.inherits(ChannelPluginManager, PluginManagerBase);

/**
 * Start the plugins for the channel
 */
ChannelPluginManager.prototype.start = function() {
  this.startPlugins();
};

/**
 * Handle an incoming message and run the command if it looks like one
 * 
 * @param who
 *            nick who sent the message
 * @param text
 *            of the message
 */
ChannelPluginManager.prototype.handleMessage = function(who, text) {
  if (this._commandRegex.test(text)) {
    var cmd = this._parseCommand(text);
    this.runCommand(cmd.command.slice(this._commandChar.length), who, cmd.args, false);
  }
};

/**
 * Default handler for all callbacks
 * 
 * @param type
 *            of callback
 * @param args
 */
ChannelPluginManager.prototype.handler = function(type, args) {
  if (type == "message") {
    this.handleMessage(args[0], args[1]);
  }
  for ( var name in this._plugins) {
    var plugin = this._plugins[name];
    if (plugin[type] !== undefined) {
      plugin[type].apply(plugin, args);
    }
  }
};

/**
 * Update a configuration value of a plugin
 * 
 * @param name of plugin
 * @param key configuration key
 * @param value new value for configuration
 */
ChannelPluginManager.prototype.updatePluginConfig = function(name, key, value) {
  var plugin = this._plugins[name];
  if (plugin === undefined || plugin.updateConfig === undefined) {
    throw "Plugin not loaded, unknown or not configurable: " + name;
  } else {
    var command = plugin.command;
    if (plugin.updateConfig(key, value)) {
      if (this._config[name] === undefined) {
        this._config[name] = {};
      }
      this._config[name][key] = value;

      if (plugin.command != command) {
        delete this._commands[command];
        this._commands[plugin.command] = plugin;
      }
    } else {
      throw "Not a valid configuration name: " + name;
    }
  }
};

/**
 * Check to see if a nick has at least the given mode
 * 
 * @param nick
 *            Nick whos mode is being checked
 * @param mode
 *            Minimum mode the nick has either o or v
 * @param callback
 *            Function to call with results one argument is passed to the
 *            function true if the nick has at least the mode or false otherwise
 */
ChannelPluginManager.prototype.checkMode = function(nick, mode, callback) {
  this._modeTracker.checkMode(nick, mode, callback);
};

exports.PluginMap = PluginMap;
exports.PluginManager = PluginManager;

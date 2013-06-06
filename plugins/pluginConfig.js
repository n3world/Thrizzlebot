var ConfigurablePlugin = require("../lib/thrizzle").ConfigurablePlugin;
var ip = require("../lib/input_parsers");
var util = require('util');

function PluginConfig(bot, manager, config, channel) {
  ConfigurablePlugin.call(this, {"command" : ip.commandNameParser, "modes": undefined});
  this.command = "config";
  // Channel modes a user needs to have to run a configure command
  // No modes means everybody can
  this.modes = ["@"];

  this.description = "Configure plugins";
  this.minArgs = 1;
  this.maxArgs = 4;
  
  this._bot = bot;
  this._manager = manager;
  this._channel = channel;
  
  // The different subcommands of this command
  this._cmds = {
    list : {
      args : [],
      run : function() {
        var plugins = [];
        for ( var plugin in manager.getPluginMap().getPlugins()) {
          if (manager.getPlugins()[plugin] === undefined) {
            plugin += " (disabled)";
          }
          plugins.push(plugin);
        }
        return plugins.join(", ");
      }
    },

    enable : {
      args : ["<plugin>"],
      run : function(plugin) {
        try {
          manager.enablePlugin(plugin);
        } catch (e) {
          return "Failed to enable plugin: " + plugin;
        }
      }
    },

    disable : {
      args : ["[<plugin>"],
      run : function(plugin) {
        if (!manager.disablePlugin(plugin)) {
          return "Plugin does not exist: " + plugin;
        }
      }
    },
    
    show : {
      args : ["<plugin>"],
      run : function(pluginName) {
        var plugin = manager.getPlugins()[pluginName];
        if (plugin === undefined || plugin.getConfigVariables === undefined) {
          return "Plugin not loaded, unknown or not configurable: " + pluginName;
        } else {
          var result = [pluginName + " configuration values:"];
          var conf = plugin.getConfigVariables();
          for (var name in conf) {
            result.push("    " + name + " = " +
                (util.isArray(conf[name]) ? JSON.stringify(conf[name]) : conf[name]));
          }
          return result;
        }
      }
    },
    
    update : {
      args : ["<plugin>", "<config>", "<value>"],
      run : function(pluginName, name, value) {
        try {
          manager.updatePluginConfig(pluginName, name, value);
        } catch (e) {
          return e.toString();
        }
      }
    }
  };
  
  var h = [];
  for (var k in this._cmds) {
    h.push(k + " " + this._cmds[k].args.join(" "));
  }
  this.help = "[" + h.join(" | ") + "]";
  
  this.applyConfig(config);
}

util.inherits(PluginConfig, ConfigurablePlugin);

PluginConfig.prototype.run = function(who, args, isPm) {
  var target = isPm ? who : this._channel;
  var prefix = isPm ? "" : who + ": ";
  var message = undefined;
  var _this = this;
  
  var respond = function(response) {
    if (response !== undefined) {
      if (util.isArray(response)) {
        response = response.join("\n" + prefix);
      }
      _this._bot.say(target, prefix + response);
    }
  };
  
  var command = args.shift();
  if (this._cmds[command] === undefined) {
    message = "Invalid command: " + command;
  } else {
    var cmd = this._cmds[command];
    if (cmd.args.length != args.length) {
      if (cmd.args.length == 0) {
        message  = command + " does not take any arguments";
      } else {
        message = "Incorrect arguments: " + command + " " + command.args.join(" ");
      }
    } else {
      this._bot.whois(who, function(whois) {
        if (_this._hasPerms(whois.channels)) {
          message = _this._cmds[command].run.apply(undefined, args);
        } else {
          message = "Not enough permissions";
        }

        respond(message);
      });
    }
  }

  respond(message);
};

/**
 * Check to see if the user has permissions
 * @param channels
 * @returns {Boolean}
 */
PluginConfig.prototype._hasPerms = function(channels) {
  if (this.modes.length == 0) {
    return true;
  }
  for (var i in this.modes) {
    var nickMode = this.modes[i] + this._channel;
    if (channels.indexOf(nickMode) >= 0) {
      return true;
    }
  }
  return false;
};

exports.init = function(bot, manager, config, channel) {
  return new PluginConfig(bot, manager, config, channel);
};

exports.type = ["channel"];

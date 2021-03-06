var PmOnlyCommandPlugin = require("../lib/thrizzle").PmOnlyCommandPlugin;
var ip = require("../lib/input_parsers");
var util = require('util');

function PluginConfig(bot, manager, config, channel) {
  PmOnlyCommandPlugin.call(this, bot, {"command" : ip.commandNameParser, "mode": ip.modeParser});
  this.command = "config";
  // Channel modes a user needs to have to run a configure command
  // No modes means everybody can
  this.mode = "o";

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

util.inherits(PluginConfig, PmOnlyCommandPlugin);

PluginConfig.prototype.runCommand = function(who, args, toPm) {
  var target = toPm ? who : this._channel;
  var prefix = toPm ? "" : who + ": ";
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
        message = "Incorrect arguments: " + command + " " + cmd.args.join(" ");
      }
    } else {
      this._manager.checkMode(who, this.mode, function(hasMode) {
        var checkMessage;
        if (hasMode) {
          checkMessage = _this._cmds[command].run.apply(undefined, args);
        } else {
          checkMessage = "Not enough permissions";
        }

        respond(checkMessage);
      });
    }
  }

  respond(message);
};

exports.init = function(bot, manager, config, channel) {
  return new PluginConfig(bot, manager, config, channel);
};

exports.type = ["channel"];

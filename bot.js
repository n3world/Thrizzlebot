module.exports = (function() {
  "use strict";

  var irc = require("irc");
  var util = require("util");
  var config = require("./config");
  var thrizzle = require("./lib/thrizzle");
  var pluginManager = undefined;

  // Create the bot name
  var bot = new irc.Client(config.server, config.botName, {});

  bot._join = bot.join;
  bot.join = function(channel) {
    console.log("Joining channel " + channel);
    if (pluginManager !== undefined) {
      var manager = pluginManager.createManager(channel);
      manager.start();
    }
    bot._join(channel);
  };

  bot.addListener('error', function(message) {
    console.log(message);
    throw message;
  });

  // Pull in the plugins
  function loadPlugins(config) {
    var _jsExt = ".js";
    var pluginMap = new thrizzle.PluginMap();
    var pluginDir = config["dir"] ? config["dir"] : __dirname + "/plugins";

    var fs = require("fs");

    // If plugins dir is a directory load all plugins found there
    var stat = fs.statSync(pluginDir);
    if (stat.isDirectory()) {
      console.log("Loading plugins");

      var entries = fs.readdirSync(pluginDir);
      for ( var i = 0; i < entries.length; ++i) {
        var entry = entries[i];
        if (entry.length > _jsExt.length
            && entry.substring(entry.length - _jsExt.length, entry.length) == _jsExt) {
          var pluginName = entry.substring(0, entry.length - _jsExt.length);
          console.log("Loading plugin: " + pluginName);
          try {
            pluginMap.addPlugin(pluginName, require(pluginDir + "/" + pluginName));
          } catch (err) {
            if (config.haltOnLoadFailure) {
              throw err;
            } else {
              console.error("Failed to load plugin " + name + ": " + err);
            }
          }
        }
      }
      console.log("Plugin loading done");
    } else {
      console.warn("Plugin directory is not a directory: " + pluginDir);
    }
    pluginManager = new thrizzle.PluginManager(bot, config, pluginMap);
    pluginManager.start();
  }

  // don't let plugins be undefined
  if (config.plugins === undefined) {
    config.plugins = {};
  }
  
  // Make sure channels is not an array
  if (util.isArray(config.channels)) {
    var arrayChannels = config.channels;
    config.channels = {};
    for (var i in arrayChannels) {
      config.channels[arrayChannels[i]] = {};
    }
  }
  
  // Give plugins access to the per channel config
  config.plugins.channels = config.channels;
  loadPlugins(config.plugins);

  if (config.channels !== undefined) {
    bot.addListener('motd', function() {
      for ( var channel in config.channels) {
        bot.join(channel);
      }
    });
  }
})();

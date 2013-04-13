/**
 * A helper function for initializing plugins which support channel and pm commands
 *
 * @param bot Bot that we are binding to
 * @param plugin Plugin that we binding to the bot
 * @param config for the plugin
 * @param needChannel whether or not this plugin needs to know about a channel in the command
 *     If this is true the first argument to the pm command must be the channel
 */
exports.PluginCommandInit = function(bot, plugin, config, needChannel) {

  // Construct the object to register for channel commands
  function respondToChannelCommand() {
    function run(who, channel, args, packet) {
      plugin.respondToCommand(who, channel, false, args);
    }

    return {run: run, help: plugin.help, description: plugin.description, minArgs: plugin.minArgs, maxArgs: plugin.maxArgs};
  }

  // Construct the object to register for pm commands
  function respondToPmCommand () {
    var help = plugin.help;
    var minArgs = plugin.minArgs, maxArgs = plugin.maxArgs;

    if (needChannel) {
      help = "<channel> " + help;
      if (plugin.minArgs === undefined) {
        minArgs = 1;
      } else {
        minArgs = plugin.minArgs + 1;
      }

      if (plugin.maxArgs !== undefined) {
        maxArgs = plugin.maxArgs + 1;
      }
    }

    function run(packet) {
      var channel;
      if (needChannel) {
        channel = packet.args[0];
        packet.args.splice(0, 1);
      }
      plugin.respondToCommand(packet.nick, channel, true, packet.args);
    }

    return {run: run, help: help, description: plugin.description, minArgs: minArgs, maxArgs: maxArgs};
  }

  // Push the config into the plugin
  function applyConfig() {
    if (config !== undefined) {
      for (var key in config) {
        plugin[key] = config[key];
      }
    }
  }

  // Initialize everything
  applyConfig();
  bot.addChannelCommand(plugin.command, respondToChannelCommand());
  bot.addPmCommand(plugin.command, respondToPmCommand());
}


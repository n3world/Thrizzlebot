exports.init = (function() {
  "use strict";
  var _bot,
      _config,
      auth = {},
      globalConfig = require('../config'),
      name = "welcome",
      util = require('util');

  if(globalConfig.authenticate) {
    auth = require("./auth");
  }
  /**
   * Listens for joins and sends a welcome message
  */
  function listenForMode(channel, by, mode, argument, message) {
    var modes = message.args[1],
        pattern,
        salutation,
        who = argument,
        valid = false;

    if (who !== _bot.nick) {
      _config.modes.map(function(mode) {
        if(modes.indexOf(mode) > -1) {
          valid = true;
        }
      });

      if(valid === true) {
        pattern = _config.salutation;
        salutation = util.format(pattern, who);
        _bot.say(channel, salutation);
      }
    }
  }

  /**
   * Initialize listeners.
   */
  function init(bot, config) {
    _bot = bot;
    _config = config;
    _bot.addListener("+mode", listenForMode);
  }

  return init;
})();
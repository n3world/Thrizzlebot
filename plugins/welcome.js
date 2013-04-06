exports.init = (function() {
  "use strict";
  var _bot,
      config = require("../config"),
      util = require('util');

  /**
   * Listens for joins and sends a welcome message
  */
  function listenForJoin(channel, who) {
    var pattern,
        salutation;

    if (who !== config.botName) {
      pattern = config.plugins.welcome.salutation;
      salutation = util.format(pattern, who);
      _bot.say(channel, salutation);
    }
  }

  /**
   * Initialize listeners.
   */
  function init(bot) {
    _bot = bot;
    _bot.addListener("join", listenForJoin);
  }

  return init;
})();
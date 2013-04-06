exports.init = (function() {
  "use strict";
  var _bot,
      _config,
      name = "welcome",
      util = require('util');

  /**
   * Listens for joins and sends a welcome message
  */
  function listenForJoin(channel, who) {
    var pattern,
        salutation;

    if (who !== _bot.nick) {
      pattern = _config.salutation;
      salutation = util.format(pattern, who);
      _bot.say(channel, salutation);
    }
  }

  /**
   * Initialize listeners.
   */
  function init(bot, config) {
    _bot = bot;
    _config = config;
    _bot.addListener("join", listenForJoin);
  }

  return init;
})();
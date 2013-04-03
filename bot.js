(function () {
  "use strict";

  var irc = require("irc");

  var config = {
    channels: ["#npnd-dev"],
    server: "irc.freenode.net",
    botName: "ThrizzleBot"
  };

  // Create the bot name
  var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
  });

  // Listen for joins
  bot.addListener("join", function (channel, who) {
    if (who !== config.botName) {
      bot.say(channel, who + " WHATUUUP");
    }
  });

  /**
   * nick = string. nick of person pm-ing
   * text = string, content of pm
   * message = object, detailed info about user and messsage
   **/
  bot.addListener("pm", function (nick, text, message) {
    var packet = {};
    packet.nick = nick;
    packet.args = text.split(/\s/g);

    var command = this[packet.args[0]];
    if ('function' !== typeof command) {
      bot.say(nick, "I don't know what you're talking about");
    } else {
      packet.args.splice(0, 1);
      return command(packet);
    }
  });

  // Tweets whatever you send this to the @NPND Account
  // OP status in #npnd required
  bot.tweet = function (packet) {
    bot.say(packet.nick, "If this was working I would tweet: " + packet.args[0]);
  };

  // Summons a registered user to the channel for discussion
  // Requires contact method to be registered with ThrizzleBot
  bot.summon = function (packet) {
    bot.say(packet.nick, "If this was working I would summon: " + packet.args[0]);
  };

  //-- Seen module
  //(function(bot) {
  var seen = {};

  /**
   * Record when we observe an action by a user.
   */
  function observer(action, channel, who) {
    if (who !== config.botName) {
      if (!seen[channel]) {
        seen[channel] = {};
      }
      seen[channel][who] = {
        action: action,
        date: new Date()
      };
    }
  }

  /**
   * Answer '!seen' requests.
   */
  function responder(who, channel, text, packet) {
    var params = text.split(/\s/),
        subject = params[1];
    if (seen[channel] && seen[channel][subject]) {
      var last = seen[channel][subject];
      bot.say(channel, who + ": " + subject + " was last seen " + last.action + " at " + last.date);
    } else {
      bot.say(channel, who + ": Seen who?");
    }
  }

  /**
   * Initialize listeners.
   */
  function init() {
    bot.addListener("join", function (channel, who) {
      return observer("joining: " + channel, channel, who);
    });
    bot.addListener("message#", function (who, channel, text, packet) {
      if (0 === text.indexOf('!seen')) {
        responder(who, channel, text, packet);
      }
      return observer("saying: '" + text + "'", channel, who);
    });
  }

  init();
  //})(bot);
})();

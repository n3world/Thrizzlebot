exports.init = (function () {
  "use strict";
  var _bot,
      name = "seen",
      _seen = {},
      _description = "Respond with the last action a user performed";

  function listenForJoin(channel, who) {
    var msg = "joining " + channel;
    observer(msg, channel, who);
  }

  function listenForKick(channel, nick, by, reason, message) {
    var msg = "getting kicked by " + by + " out of " + channel;
    if (reason) {
      msg += " because: '" + reason + "'";
    }
    observer(msg, channel, nick);
  }

  function listenForMessage(who, channel, text, packet) {
    // Observe the action
    var msg = "saying: '" + text + "'";
    observer(msg, channel, who);
  }

  function listenForNickChange(oldnick, newnick, channels, message) {
    var i,
        msg = "changing nicks from " + oldnick + " to " + newnick;
    // Record both the old and the new nick for all channels
    for (i = channels.length - 1; 0 <= i; i -= 1) {
      observer(msg, channels[i], oldnick);
      observer(msg, channels[i], newnick);
    }
  }

  function listenForPart(channel, nick, reason, message) {
    var msg = "leaving " + channel;
    console.log(reason);
    console.log(message);
    if (reason) {
      msg += " saying: '" + reason + "'";
    }
    observer(msg, channel, nick);
  }

  /**
   * Record when we observe an action by a user.
   */
  function observer(action, channel, who) {
    if (who !== _bot.userName) {
      if (!_seen[channel]) {
        _seen[channel] = {};
      }
      _seen[channel][who] = {
        "action": action,
        "date": new Date()
      };
      console.log(channel, who, action);
    }
  }

  /**
   * Answer '!seen' requests.
   */
  function getResponse(channel, subject) {
    var response = "";
    if (_seen[channel] && _seen[channel][subject]) {
      var last = _seen[channel][subject];
      response = subject + " was last seen " + last.action + " at " + last.date;
    } else {
      response = "Seen who?"
    }
    return response;
  }

  // Hander for channel command interface
  function respondToChannelCommand(bot) {
    var _bot = bot;
    var help = "<nick>";

    function run(who, channel, args, packet) {
      var response = getResponse(channel, args[0]);
      _bot.say(channel, who + ": " + response);
    }

    return {"run": run, "help":help, minArgs: 1, maxArgs: 1, description: _description};
  }


  /**
   * PM command handler
   */
  function pmResponder(bot) {
    var _bot = bot;
    var help = "<channel> <nick>";

    function run(packet) {
      var response = getResponse(packet.args[0], packet.args[1]);
       _bot.say(packet.nick, response);
    }

    return {"help":help, "run":run, minArgs: 2, maxArgs: 2, description: _description};
  }

  /**
   * Initialize listeners.
   */
  function init(bot, config) {
    _bot = bot;
    _bot.addListener("join", listenForJoin);
    _bot.addListener("kick", listenForKick);
    _bot.addListener("message#", listenForMessage);
    _bot.addListener("nick", listenForNickChange);
    _bot.addListener("part", listenForPart);
    _bot.addPmCommand(name, pmResponder(_bot));
    _bot.addChannelCommand(name, respondToChannelCommand(_bot));
  }

  return init;
})();

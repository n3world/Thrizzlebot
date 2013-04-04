exports.init = (function () {
  "use strict";
  var _bot,
      _seen = {};

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

    // And also see if we should respond!
    if (0 === text.indexOf('!seen')) {
      responder(who, channel, text, packet);
    }
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
  function responder(who, channel, text, packet) {
    var params = text.split(/\s/),
        subject = params[1];
    if (_seen[channel] && _seen[channel][subject]) {
      var last = _seen[channel][subject];
      _bot.say(channel, who + ": " + subject + " was last seen " + last.action + " at " + last.date);
    } else {
      _bot.say(channel, who + ": Seen who?");
    }
  }

  /**
   * Initialize listeners.
   */
  function init(bot) {
    _bot = bot;
    _bot.addListener("join", listenForJoin);
    _bot.addListener("kick", listenForKick);
    _bot.addListener("message#", listenForMessage);
    _bot.addListener("nick", listenForNickChange);
    _bot.addListener("part", listenForPart);
  }

  return init;
})();


var baseInit = require('thrizzle').PluginCommandInit;

// Object to contain all the state and config of recap
function Seen(bot) {
  this.command = "seen"
  this.help = "<nick>";
  this.description = "Respond with the last action a user performed";
  this.minArgs = 1;
  this.maxArgs = 1;

  this._bot = bot;
  this._seen = {};
}

/**
 * Answer '!seen' requests.
 */
Seen.prototype.respondToCommand = function(nick, channel, isPm, args) {
  var response = "";
  var subject = args[0];
  if (this._seen[channel] !== undefined && this._seen[channel][subject] !== undefined) {
    var last = this._seen[channel][subject];
    response = subject + " was last seen " + last.action + " at " + last.date;
  } else {
    response = "Seen who?"
  }

  var target;
  if (isPm) {
    target = nick;
  } else {
    target = channel;
    response = nick + ": " + response;
  }
  
  this._bot.say(target, response);
}

exports.init = (function () {
  "use strict";
  var _bot, _seen;

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
      if (_seen[channel] == undefined) {
        _seen[channel] = {};
      }
      _seen[channel][who] = {
        "action": action,
        "date": new Date()
      };
    }
  }

  /**
   * Initialize listeners.
   */
  return function(bot, config) {
    var seen = new Seen(bot);
    _seen = seen._seen;
    _bot = bot;

    baseInit(bot, seen, config, true);
    _bot.addListener("join", listenForJoin);
    _bot.addListener("kick", listenForKick);
    _bot.addListener("message#", listenForMessage);
    _bot.addListener("nick", listenForNickChange);
    _bot.addListener("part", listenForPart);
  }
})();

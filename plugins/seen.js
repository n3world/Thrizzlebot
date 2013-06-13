var PmOnlyCommandPlugin = require("../lib/thrizzle").PmOnlyCommandPlugin;
var ip = require("../lib/input_parsers");
var util = require('util');

// Object to contain all the state and config of recap
function Seen(bot, config, channel) {
  PmOnlyCommandPlugin.call(this, bot, { "command" : ip.commandNameParser});
  this.command = "seen";
  this.help = "<nick>";
  this.description = "Respond with the last action a user performed";
  this.minArgs = 1;
  this.maxArgs = 1;

  this._bot = bot;
  this._channel = channel;
  this._seen = {};

  this.applyConfig(config);
}

util.inherits(Seen, PmOnlyCommandPlugin);

/**
 * Answer 'seen' requests.
 */
Seen.prototype.runCommand = function(nick, args, toPm) {
  var response = "";
  var subject = args[0];
  if (this._seen[subject] !== undefined) {
    var last = this._seen[subject];
    response = subject + " was last seen " + last.action + " at " + last.date;
  } else {
    response = "Seen who?";
  }

  if (!toPm) {
    response = nick + ": " + response;
  }

  return response;
};

Seen.prototype.join = function(who) {
  var msg = "joining " + this._channel;
  this._observer(msg, who);
};

Seen.prototype.kick = function(nick, by, reason) {
  var msg = "getting kicked by " + by + " out of " + this._channel;
  if (reason) {
    msg += " because: '" + reason + "'";
  }
  this._observer(msg, nick);
};

Seen.prototype.message = function(who, text) {
  var msg = "saying: '" + text + "'";
  this._observer(msg, who);
};

Seen.prototype.nick = function(oldnick, newnick) {
  var msg = "changing nicks from " + oldnick + " to " + newnick;
  this._observer(msg, oldnick);
  this._observer(msg, newnick);
};

Seen.prototype.part = function(nick, reason) {
  var msg = "leaving " + this._channel;
  if (reason) {
    msg += " saying: '" + reason + "'";
  }
  this._observer(msg, nick);
};

Seen.prototype._observer = function(action, who) {
  if (who !== this._bot.userName) {
    this._seen[who] = {
      "action" : action,
      "date" : new Date()
    };
  }
};

exports.init = function(bot, manager, config, channel) {
  return new Seen(bot, config, channel);
};

exports.type = [ 'channel' ];

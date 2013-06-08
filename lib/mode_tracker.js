/**
 * Object to track users modes in the channel
 * 
 * @param bot
 *            The bot object
 * @param channel
 *            The channel name
 * @returns
 */
function ModeTracker(bot, channel) {
  this._bot = bot;
  this._channel = channel;

  this._modes = {};
  this._track = {
    "o" : 2,
    "v" : 1
  };
  this._chanChars = {
    "@" : "o",
    "+" : "v"
  };
}

ModeTracker.prototype.join = function(who) {
  this._modes[who] = 0;
};

ModeTracker.prototype.part = function(who) {
  delete this._modes[who];
};

ModeTracker.prototype.nick = function(oldNick, newNick) {
  if (this._modes[oldNick] === undefined) {
    this.join(newNick);
  } else {
    this._modes[newNick] = this._modes[oldNick];
    this.part(oldNick);
  }
};

ModeTracker.prototype.addMode = function(who, mode, modeArgs) {
  if (this._track[mode] !== undefined) {
    this._modes[modeArgs] |= this._track[mode];
  }
};

ModeTracker.prototype.subMode = function(who, mode, modeArgs) {
  if (this._track[mode] !== undefined) {
    this._modes[modeArgs] &= ~this._track[mode];
  }
};

/**
 * Check to see if the given nick as at least mode in the channel
 * 
 * @param nick
 * @param mode
 *            minimum mode to check if the nick has. Empty string means no mode
 * @param callback
 *            Function to call with result.
 */
ModeTracker.prototype.checkMode = function(nick, mode, callback) {
  var hasMode = "" == mode;
  if (this._track[mode] !== undefined) {
    if (this._modes[nick] === undefined) {
      this.join(nick);
      this._lookup(nick, mode, callback);
      hasMode = undefined;
    } else {
      hasMode = (this._modes[nick] >= this._track[mode]);
    }
  }

  if (hasMode !== undefined) {
    callback(hasMode);
  }
};

/**
 * Use whois to look up if the nick has a mode in the channel we care about
 * 
 * @param nick
 *            of user
 * @param mode
 *            minimum mode to check if the user has
 * @param callback
 *            function to call with results
 */
ModeTracker.prototype._lookup = function(nick, mode, callback) {
  var _this = this;

  this._bot.whois(nick, function(info) {
    for ( var i in info.channels) {
      var channel = info.channels[i];
      var firstChar = channel.charAt(0);
      if (_this._chanChars[firstChar] !== undefined && firstChar + _this._channel == channel) {
        _this.addMode(undefined, _this._chanChars[firstChar], nick);
        break;
      }
    }

    _this.checkMode(nick, mode, callback);
  });
};

exports.ModeTracker = ModeTracker;

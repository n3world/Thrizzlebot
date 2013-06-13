var PmOnlyCommandPlugin = require("../lib/thrizzle").PmOnlyCommandPlugin;
var ip = require("../lib/input_parsers");
var util = require('util');

// Object to contain all the state and config of recap
function Recap(bot, config) {
  PmOnlyCommandPlugin.call(this, bot, { "maxSize" : ip.createIntParser(10, 1000),
    "defaultReturn" : ip.createIntParser(1, 100), "command" : ip.commandNameParser });
  this.maxSize = 100;
  this.defaultReturn = 20;
  this.command = "recap";

  this.help = "[<numberOfMessages>]";
  this.description = "Replay the most recent messages in the channel";
  this.maxArgs = 1;

  this._bot = bot;
  this._msgs = [];
  this._parts = {};

  this.applyConfig(config);
}

util.inherits(Recap, PmOnlyCommandPlugin);

Recap.prototype._lastSeen = function(nick) {
  var lastSeen = 0;
  if (this._parts[nick] !== undefined) {
    lastSeen = this._parts[nick];
  }
  return lastSeen;
};

// respondToCommand implementation for recap
Recap.prototype.runCommand = function(nick, args) {
  var numToReturn = this.defaultReturn;
  var lastSeen = this._lastSeen(nick);

  if (args.length > 0) {
    numToReturn = parseInt(args[0]);
  }

  var firstMsg = Math.max(this._msgs.length - numToReturn, 0);
  // Collect all messages which occurred after the nick last left
  var recaps = [];
  for ( var i = firstMsg; i < this._msgs.length; ++i) {
    if (lastSeen <= this._msgs[i].time) {
      recaps.push(this._msgs[i].nick + ": " + this._msgs[i].msg);
    }
  }

  // send response
  if (recaps.length > 0) {
    return recaps;
  } else {
    return "Nothing has happened";
  }
};

Recap.prototype.message = function(who, text) {
  var len = this._msgs.push({
    nick : who,
    msg : text,
    time : new Date().getTime()
  });
  if (len > this.maxSize) {
    this._msgs.splice(0, len - this.maxSize);
  }
};

Recap.prototype.part = function(channel, nick) {
  this._parts[nick] = new Date().getTime();
};

// Function for initializing a new recap instance
exports.init = function(bot, manager, config, channel) {
  return new Recap(bot, config);
};

exports.type = [ 'channel' ];

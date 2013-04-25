
var baseInit = require('../lib/thrizzle').PluginCommandInit;

// Object to contain all the state and config of recap
function Recap(bot) {
  this.maxSize = 100;
  this.defaultReturn = 20;
  this.command = "recap"
  this.help = "[<numberOfMessages>]";
  this.description = "Replay the most recent messages in the channel";
  this.maxArgs = 1;

  this._bot = bot;
  this._msgs = {};
  this._parts = {};
}

Recap.prototype._lastSeen = function(channel, nick) {
  var lastSeen = 0;
  if (this._parts[channel] !== undefined && this._parts[channel][nick] !== undefined) {
    lastSeen = this._parts[channel][nick];
  }
  return lastSeen;
}

// respondToCommand implementation for recap
Recap.prototype.respondToCommand = function(nick, channel, isPm, args) {
  if (this._msgs[channel] !== undefined) {
    var msgs = this._msgs[channel];
    var numToReturn = this.defaultReturn;
    var lastSeen = this._lastSeen(channel, nick);

    if (args.length > 0) {
      numToReturn = parseInt(args[0]);
    }

    var firstMsg = Math.max(msgs.length - numToReturn, 0);
    // Collect all messages which occurred after the nick last left
    var recaps = [];
    for (var i = firstMsg; i < msgs.length; ++i) {
       if (lastSeen <= msgs[i].time) {
         recaps.push(msgs[i].nick + ": " + msgs[i].msg);
       }
    }

    // send response
    if (recaps.length > 0) {
      this._bot.say(nick, recaps.join("\n"));
    } else {
      this._bot.say(nick, "Nothing has happened");
    }
  }
}

Recap.prototype.recordMessage = function(who, channel, text) {
  if (this._msgs[channel] === undefined) {
    this._msgs[channel] = [];
  }

  var len = this._msgs[channel].push({nick: who, msg: text, time: new Date().getTime()});
  if (len > this.maxSize) {
    this._msgs[channel].splice(0, len - this.maxSize);
  }
}

Recap.prototype.recordPart = function(channel, nick) {
  if (this._parts[channel] === undefined) {
    this._parts[channel] = {};
  }
  this._parts[channel][nick] = new Date().getTime();
}

// Function for initializing a new recap instance
exports.init = (function() {
  "use strict";
  var recap;

  function listenForMessage(who, channel, text, packet) {
    recap.recordMessage(who, channel, text);
  }

  function listenForPart(channel, nick, reason, message) {
    recap.recordPart(channel, nick);
  }

  // Function that is called to run initialization
  return function(bot, config) {
    recap = new Recap(bot);
    baseInit(bot, recap, config, true);
    bot.addListener("message#", listenForMessage);
    bot.addListener("part", listenForPart);
  }
})()



var baseInit = require('thrizzle').PluginCommandInit;

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
}

// respondToCommand implementation for recap
Recap.prototype.respondToCommand = function(nick, channel, isPm, args) {
  if (this._msgs[channel] !== undefined) {
    var msgs = this._msgs[channel];
    var numToReturn = this.defaultReturn;

    if (args.length > 0) {
      numToReturn = parseInt(args[0]);
    }

    var firstMsg = Math.max(msgs.length - numToReturn, 0);
    for (var i = firstMsg; i < msgs.length; ++i) {
       this._bot.say(nick, msgs[i].nick + ": " + msgs[i].msg);
    }
  }
}

// Function for initializing a new recap instance
exports.init = (function() {
  "use strict";
  var recap;

  function listenForMessage(who, channel, text, packet) {
    if (recap._msgs[channel] === undefined) {
      recap._msgs[channel] = [];
    }

    var len = recap._msgs[channel].push({nick: who, msg: text});
    if (len > recap.maxSize) {
      recap._msgs[channel].splice(0, len - recap.maxSize);
    }
  }

  // Function that is called to run initialization
  return function(bot, config) {
    recap = new Recap(bot);
    baseInit(bot, recap, config, true);
    bot.addListener("message#", listenForMessage);
  }
})()


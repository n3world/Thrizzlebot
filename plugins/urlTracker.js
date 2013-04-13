
var baseInit = require('../lib/thrizzle').PluginCommandInit;

function UrlTracker(bot) {
  this.maxSize = 100;
  this.defaultReturn = 10;
  this.command = "urls"
  this.help = "[<nick>] [<numberOfUrls>]";
  this.description = "Print the most recent urls seen in a channel";
  this.maxArgs = 2;

  this._bot = bot;
  this._urlRegex = new RegExp("https?://");
  this._urls = {};
}

// respondToCommand implementation for urlTracker
UrlTracker.prototype.respondToCommand = function(nick, channel, isPm, args) {
  if (this._urls[channel] !== undefined) {
    var urls = this._urls[channel];
    var numToReturn = this.defaultReturn;
    var nickFilter;

    if (args.length > 0) {
      // If we have two args we are good otherwise guess and check
      if (args.length > 1) {
        nickFilter = args[0];
        numToReturn = parseInt(args[1]);
      } else {
        var argInt = parseInt(args[0]);
        if (isNaN(argInt)) {
          nickFilter = args[0];
        } else {
          numToReturn = argInt;
          }
       }
     }

     var target = channel;
     if (isPm) {
       target = nick;
     }

     for (var i = 0, returned = 0; i < urls.length && returned < numToReturn; ++i) {
       if (nickFilter === undefined || urls[i].nick == nickFilter) {
         this._bot.say(target, urls[i].msg);
         ++returned;
      }
    }
  }
}


exports.init = (function() {
  "use strict";
  var urlTracker;

  // Handle new messages and if they have a url add them to the list
  function listenForMessage(who, channel, text, packet) {
    if (urlTracker._urlRegex.test(text)) {
      if (urlTracker._urls[channel] === undefined) {
        urlTracker._urls[channel] = [];
      }

      var len = urlTracker._urls[channel].unshift({nick: who, msg: text});
      if (len > urlTracker.maxSize) {
        urlTracker._urls[channel].splice(urlTracker.maxSize, len - urlTracker.maxSize);
      }
    }
  }

  return function(bot, config) {
    urlTracker = new UrlTracker(bot);
    baseInit(bot, urlTracker, config, true);
    bot.addListener("message#", listenForMessage);
  }
})();


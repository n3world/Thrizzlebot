
var baseInit = require('../lib/thrizzle').PluginCommandInit;

function UrlTracker(bot) {
  this.maxSize = 100;
  this.defaultReturn = 10;
  this.command = "urls"
  this.help = "[<nick>] [<numberOfUrls>]";
  this.description = "Print the most recent urls seen in a channel";
  this.maxArgs = 2;

  this._bot = bot;
  this._urls = {};
  this._urlRegex = /(https?:\/\/)?(([A-Z\-a-z1-9]+\.)+[A-Za-z]{2,4}|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?/g;

  this._url = require('url');
  this._http = require('http');
  this._https = require('https');
  this._htmlparser = require('htmlparser2');
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
         this._bot.say(target, urls[i].toString());
         ++returned;
      }
    }
  }
}

// Track urls that are in the given text
UrlTracker.prototype.trackMessage = function(nick, channel, text) {
  var match;
  while (match = this._urlRegex.exec(text)) {
    if (this._urls[channel] === undefined) {
      this._urls[channel] = [];
    }

    var urlInfo = new UrlInfo(nick, match[0]);
    var len = this._urls[channel].unshift(urlInfo);
    if (len > this.maxSize) {
      this._urls[channel].splice(this.maxSize, len - this.maxSize);
    }
    this._getDetails(urlInfo);
  }
}

// Request the document described by urlInfo and update urlInfo with details
UrlTracker.prototype._getDetails = function(urlInfo) {
  var body;
  var url = this._url.parse(urlInfo.url);
  var client,
      protocol = url.protocol;
  var _this = this;

  if (!protocol) {
    // unknown protocol lets try http
    client = this._http;
    url = "http://" + urlInfo.url;
  } else if (protocol == "http:") {
    client = this._http;
  } else if(protocol == "https:") {
    client = this._https;
  } else {
    return;
  }

  client.get(url, function(res) {
    res.on('data', function (chunk) {
      _this._parseDetails(chunk, urlInfo);
    });
  }).on('error', function(e) {/* eat it */});
}

// Parse extra details out of the html body
UrlTracker.prototype._parseDetails = function(page, urlInfo) {
  var textDestination;
  var extraHead = false;

  var parser = new this._htmlparser.Parser({
    onopentag: function(name, attribs) {
      if (name == "title") {
        textDestination = name;
	extraHead = true;
      } else if (name == "meta" && attribs.name == "description") {
        urlInfo.addExtra(attribs.name, attribs.content);

      }
    },

    ontext: function(text) {
      if (textDestination !== undefined) {
        urlInfo.addExtra(textDestination, text, extraHead);
      }
    },

    onclosetag: function(tagname) {
      textDestination = undefined;
      extraHead = false;
    }
  });

  parser.write(page);
  parser.end();
}

// Helper object to contain url information
function UrlInfo(nick, url) {
  this.nick = nick;
  this.url = url;

  this._extraInfo = [];
  this._encoder = new require('node-html-encoder').Encoder('entity');
}

UrlInfo.prototype.toString = function() {
  var string = this.nick + ": "  + this.url;

  for (var i  in this._extraInfo) {
    if (this[this._extraInfo[i]] !== undefined) {
      string += "\n    " + this[this._extraInfo[i]];
    }
  }
  return string;
}

/*
 * Add in extra url information
 * @param name name of information
 * @value information to add
 * @head whether or not insert this at the head of the list of information
 */ 
UrlInfo.prototype.addExtra = function(name, value, head) {
  this[name] = this._encoder.htmlDecode(value.trim());
  if (head) {
    this._extraInfo.unshift(name);
  } else {
    this._extraInfo.push(name);
  }
}

// Create the init function for a urlTracker plugin
exports.init = (function() {
  "use strict";
  var urlTracker;

  // Handle new messages and if they have a url add them to the list
  function listenForMessage(who, channel, text, packet) {
    urlTracker.trackMessage(who, channel, text);
  }

  return function(bot, config) {
    urlTracker = new UrlTracker(bot);
    baseInit(bot, urlTracker, config, true);
    bot.addListener("message#", listenForMessage);
  }
})();


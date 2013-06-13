var PmOnlyCommandPlugin = require("../lib/thrizzle").PmOnlyCommandPlugin;
var ip = require("../lib/input_parsers");
var util = require('util');

function UrlTracker(bot, config, channel) {
  PmOnlyCommandPlugin.call(this, bot, { "maxSize" : ip.createIntParser(10, 1000),
    "defaultReturn" : ip.createIntParser(1, 50), "command" : ip.commandNameParser,
    "resolveDetails" : ip.booleanParser, "announceDetails" : ip.booleanParser });
  // These values can all be overriden in the config
  this.maxSize = 100;
  this.defaultReturn = 10;
  this.command = "urls";
  this.resolveDetails = true;
  this.announceDetails = false;

  // Internal object variables
  this.help = "[<nick>] [<numberOfUrls>]";
  this.description = "Print the most recent urls seen in a channel";
  this.maxArgs = 2;
  this._bot = bot;
  this._channel = channel;
  this._urls = [];
  this._urlRegex =
      /(https?:\/\/)?(([A-Z\-a-z1-9]+\.)+[A-Za-z]{2,4}|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?/g;

  this._url = require('url');
  this._http = require('http');
  this._https = require('https');
  this._htmlparser = require('htmlparser2');

  this.applyConfig(config);
}

util.inherits(UrlTracker, PmOnlyCommandPlugin);

// respondToCommand implementation for urlTracker
UrlTracker.prototype.runCommand = function(nick, args) {
  var urls = this._urls;
  var numToReturn = this.defaultReturn;
  var nickFilter = undefined;

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

  var response = [];
  for ( var i = 0, returned = 0; i < urls.length && returned < numToReturn; ++i) {
    if (nickFilter === undefined || urls[i].nick == nickFilter) {
      response.push(urls[i].toString());
      ++returned;
    }
  }

  return response;
};

// Track urls that are in the given text
UrlTracker.prototype.message = function(nick, text) {
  var match;
  while (match = this._urlRegex.exec(text)) {
    var urlInfo = new UrlInfo(this._channel, nick, match[0]);
    var len = this._urls.unshift(urlInfo);
    if (len > this.maxSize) {
      this._urls.splice(this.maxSize, len - this.maxSize);
    }
    this._getDetails(urlInfo);
  }
};

// Request the document described by urlInfo and update urlInfo with details
UrlTracker.prototype._getDetails = function(urlInfo) {
  if (!this.resolveDetails) {
    return;
  }

  var url = this._url.parse(urlInfo.url);
  var client, protocol = url.protocol;
  var _this = this;

  if (!protocol) {
    // unknown protocol lets try http
    client = this._http;
    url = "http://" + urlInfo.url;
  } else if (protocol == "http:") {
    client = this._http;
  } else if (protocol == "https:") {
    client = this._https;
  } else {
    return;
  }

  client.get(url, function(res) {
    var statusCode = res.statusCode;
    var needsAnnounce = true;

    res.on('data', function(chunk) {
      if (statusCode == 200) {
        _this._parseDetails(chunk, urlInfo);
        if (needsAnnounce) {
          needsAnnounce = _this._announceDetails(urlInfo);
        }
      }
    });
  }).on('error', function(e) {/* eat it */
  });
};

// Parse extra details out of the html body
UrlTracker.prototype._parseDetails = function(page, urlInfo) {
  var textDestination = undefined;
  var extraHead = false;

  var parser = new this._htmlparser.Parser({
    onopentag : function(name, attribs) {
      if (name == "title") {
        textDestination = name;
        extraHead = true;
      } else if (name == "meta" && attribs.name == "description") {
        urlInfo.addExtra(attribs.name, attribs.content);
      }
    },

    ontext : function(text) {
      if (textDestination !== undefined) {
        urlInfo.addExtra(textDestination, text, extraHead);
      }
    },

    onclosetag : function(tagname) {
      textDestination = undefined;
      extraHead = false;
    }
  });

  parser.write(page);
  parser.end();
};

/**
 * announce the resolved url details to the channel
 * 
 * @return true if this function should be called again
 */
UrlTracker.prototype._announceDetails = function(urlInfo) {
  if (!this.announceDetails) {
    return false;
  }

  if (urlInfo.hasExtra()) {
    this._bot.say(urlInfo.channel, urlInfo.toString());
    return false;
  }
  return true;
};

// Helper object to contain url information
function UrlInfo(channel, nick, url) {
  this.channel = channel;
  this.nick = nick;
  this.url = url;

  this._extraInfo = [];
  this._encoder = new require('node-html-encoder').Encoder('entity');
}

/**
 * @param extras
 *            list of extras to include in the string. If null all extras are
 *            included
 * 
 * @return a string representation of this object
 */
UrlInfo.prototype.toString = function() {
  var string = this.nick + ": " + this.url;

  for ( var i in this._extraInfo) {
    var name = this._extraInfo[i];
    if (this[name] !== undefined) {
      string += "\n    " + this[name];
    }
  }
  return string;
};

/**
 * Add in extra url information
 * 
 * @param name
 *            name of information
 * @param value
 *            information to add
 * @param head
 *            whether or not insert this at the head of the list of information
 */
UrlInfo.prototype.addExtra = function(name, value, head) {
  if (value !== undefined) {
    this[name] = this._encoder.htmlDecode(value.trim());
    if (head) {
      this._extraInfo.unshift(name);
    } else {
      this._extraInfo.push(name);
    }
  }
};

/**
 * @return true if this urlInfo has any extra info
 */
UrlInfo.prototype.hasExtra = function() {
  return this._extraInfo.length > 0;
};

exports.init = function(bot, manager, config, channel) {
  return new UrlTracker(bot, config, channel);
};

exports.type = [ 'channel' ];

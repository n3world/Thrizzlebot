exports.init = (function () {
  // Values which can be overriden in the config
  this.maxSize = 100;
  this.defaultReturn = 10;
  this.command = "urls";

  // private values
  var _bot;
  var _urlRegex = new RegExp("https?://");
  var _urls = {};
  var _baseHelp = "[<nick>] [<numberOfUrls>]";
  var _description = "Print the most recent urls seen in a channel";

  // Handle new messages and if they have a url add them to the list
  function listenForMessage(who, channel, text, packet) {
    if (_urlRegex.test(text)) {
      if (!_urls.channel) {
        _urls.channel = [];
      }

      var len = _urls.channel.unshift({nick: who, msg: text});
      if (len > maxSize) {
        _urls.channel.splice(maxSize, len - maxSize);
      }
    }
  }

  // Respond with the most recent urls seen in the channel
  function respondToCommand(target, channel, args) {
    if (_urls.channel) {
      var numToReturn = defaultReturn;
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

       for (var i = 0, returned = 0; i < _urls.channel.length && returned < numToReturn; ++i) {
         if (!nickFilter || _urls.channel[i].nick == nickFilter) {
           _bot.say(target, _urls.channel[i].msg);
           ++returned;
        }
      }
    }
  }

  function respondToChannelCommand(bot) {
    var help = _baseHelp;

    function run(who, channel, args, packet) {
      respondToCommand(channel, channel, args);
    }

    return {"run": run, "help":help, description: _description, maxArgs: 2};
  }

  function respondToPmCommand(bot) {
    var help = "<channel> " + _baseHelp;

    function run(packet) {
      var channel = packet.args[0]
      packet.args.splice(0, 1);
      respondToCommand(packet.nick, channel, packet.args);
    }

    return {"run": run, "help":help, description: _description, minArgs: 1, maxArgs: 3};
  }

  // Pull in everything from the config into this plugin
  function applyConfig(config) {
    if (config) {
      for (var key in config) {
        this[key] = config[key];
      }
    }
  }

  function init(bot, config) {
    _bot = bot;
    applyConfig(config);
    _bot.addListener("message#", listenForMessage);
    _bot.addChannelCommand(command, respondToChannelCommand(_bot));
    _bot.addPmCommand(command, respondToPmCommand(_bot));
  }

  return init;
})();

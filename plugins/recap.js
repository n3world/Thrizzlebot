exports.init = (function () {
  // Values which can be overriden in the config
  this.maxSize = 200;
  this.defaultReturn = 20;
  this.command = "recap"; 

  var _bot;
  var _msgs = {};
  var _baseHelp = "[<numberOfMessages>]";
  var _description = "Replay the most recent messages in the channel";

  // Handle new messages and if they have a url add them to the list
  function listenForMessage(who, channel, text, packet) {
    if (!_msgs.channel) {
      _msgs.channel = [];
    }

    var len = _msgs.channel.push({nick: who, msg: text});
    if (len > maxSize) {
      _msgs.channel.splice(0, len - maxSize);
    }
  }

  // Respond with the most recent messages seen in the channel
  function respondToCommand(target, channel, args) {
    if (_msgs.channel) {
      var numToReturn = defaultReturn;

      if (args.length > 0) {
        numToReturn = parseInt(args[0]);
      }

      var firstMsg = Math.max(_msgs.channel.length - numToReturn, 0);
      for (var i = firstMsg; i < _msgs.channel.length; ++i) {
         _bot.say(target, _msgs.channel[i].nick + ": " + _msgs.channel[i].msg);
      }
    }
  }

  function respondToChannelCommand(bot) {
    var help = _baseHelp;

    function run(who, channel, args, packet) {
      respondToCommand(who, channel, args);
    }

    return {"run": run, "help":help, description: _description, maxArgs: 1};
  }

  function respondToPmCommand(bot) {
    var help = "<channel> " + _baseHelp;

    function run(packet) {
      var channel = packet.args[0]
      packet.args.splice(0, 1);
      respondToCommand(packet.nick, channel, packet.args);
    }

    return {"run": run, "help":help, description: _description, minArgs: 1, maxArgs: 2};
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
})()

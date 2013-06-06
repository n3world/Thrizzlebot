var ConfigurablePlugin = require("../lib/thrizzle").ConfigurablePlugin;
var ip = require("../lib/input_parsers");
var util = require('util');

function Welcome(bot, config, channel) {
  ConfigurablePlugin.call(this, {"salutation" : undefined, "modes" : ip.modesParser});
  this.salutation = "Welcome %s";
  this.modes = ["o"];
  
  this._bot = bot;
  this._channel = channel;
  
  this.applyConfig(config);
}

util.inherits(Welcome, ConfigurablePlugin);

Welcome.prototype.addMode = function(by, mode, argument, message) {
  var modes = message.args[1], who = argument, valid = false, salutation;

  if (who !== this._bot.nick) {
    this.modes.map(function(mode) {
      if (modes.indexOf(mode) > -1) {
        valid = true;
      }
    });

    if (valid === true) {
      salutation = util.format(this.salutation, who);
      this._bot.say(this._channel, salutation);
    }
  }
};

exports.init = function(bot, manager, config, channel) {
  return new Welcome(bot, config, channel);
};

exports.type = [ 'channel' ];

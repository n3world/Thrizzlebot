var ip = require("../lib/input_parsers");
var util = require("util");

/**
 * Base object for plugins that can be configured
 * 
 * @param variables
 *            Either array of variables that are configurable or an object with property name of
 *            configurable variable and value is a parsing validation function or undefined for no
 *            function
 * @returns
 */
function ConfigurablePlugin(variables) {
  if (util.isArray(variables)) {
    this._variables = {};
    for (var i in variables) {
      this._variables[variables[i]] = undefined;
    }
  } else {
    this._variables = variables;
  }
}

/**
 * Apply a configuration object to this object
 * 
 * @param config
 *            Configuration object
 */
ConfigurablePlugin.prototype.applyConfig = function(config) {
  if (config === undefined) {
    return;
  }
  for ( var name in this._variables) {
    if (config[name] !== undefined) {
      this._setConfig(name, config[name]);
    }
  }
};

/**
 * 
 * @returns All configurable variables and there current value
 */
ConfigurablePlugin.prototype.getConfigVariables = function() {
  var vars = {};
  for (var name in this._variables) {
    vars[name] = this[name];
  }
  return vars;
};

/**
 * 
 * @param name
 *            of configuration value to update
 * @param value
 *            new value for configuration
 * @returns {Boolean} true if the configuration name is a valid variable
 */
ConfigurablePlugin.prototype.updateConfig = function(name, value) {
  if (this._variables.hasOwnProperty(name)) {
    this._setConfig(name, value);
    return true;
  }
  return false;
};

ConfigurablePlugin.prototype._setConfig = function(name, value) {
  if (this._variables[name] !== undefined) {
    value = this._variables[name](value);
  }
  this[name] = value;
};

/**
 * Plugin base prototype to handle always responding to commands as PMs
 * 
 * @param bot
 * @param variables
 *            object mapping variable names to parsing function or undefined for
 *            no parsing
 * @returns
 */
function PmOnlyCommandPlugin(bot, variables) {
  variables.respondAsPmAlways = ip.booleanParser;
  ConfigurablePlugin.call(this, variables);
  this.respondAsPmAlways = true;
  
  this._bot = bot;
}

util.inherits(PmOnlyCommandPlugin, ConfigurablePlugin);

/**
 * Entry point for for commands
 * 
 * @param nick
 * @param args
 * @param isPm
 */
PmOnlyCommandPlugin.prototype.run = function(nick, args, fromPm) {
  var toPm = fromPm || this.respondAsPmAlways;
  var target = toPm ? nick : this._channel;

  var response = this.runCommand(nick, args, toPm, fromPm);
  if (response !== undefined) {
    if (util.isArray(response)) {
      for (var i in response) {
        this._bot.say(target, response[i]);
      }
    } else {
      this._bot.say(target, response);
    }
  }
};

exports.ConfigurablePlugin = ConfigurablePlugin;
exports.PmOnlyCommandPlugin = PmOnlyCommandPlugin;

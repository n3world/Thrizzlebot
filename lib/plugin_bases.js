/**
 * Base object for plugins that can be configured
 * 
 * @param variables
 *            {Array} of the names of variables which are configurable
 * @returns
 */
function ConfigurablePlugin(variables) {
  this._variables = variables;
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
  for ( var i in this._variables) {
    var name = this._variables[i];
    if (config[name] !== undefined) {
      this[name] = config[name];
    }
  }
};

/**
 * 
 * @returns The list of variable names which can be changed
 */
ConfigurablePlugin.prototype.getConfigVariables = function() {
  return this._variables;
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
  if (this._variables.indexOf(name) != -1) {
    this[name] = value;
    return true;
  }
  return false;
};

exports.ConfigurablePlugin = ConfigurablePlugin;

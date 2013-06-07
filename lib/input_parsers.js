var util = require('util');

exports.createIntParser = function(min, max) {
  return function(value) {
    value = parseInt(value);
    if (min !== undefined && value < min) {
      throw "Value less than minimum: " + min;
    }
    
    if (max !== undefined && value > max) {
      throw "Value greater than maximum: " + max;
    }
    
    return value;
  };
};

exports.booleanParser = function(value) {
  if (typeof(value) == 'boolean') {
    return value;
  }
  return value.toLowerCase() == "true";
};

exports.commandNameParser = function(value) {
  if (!/^\w+$/.test(value)) {
    throw "Invalid command name: " + value;
  }
  return value;
};

function modeParser(value) {
  var validModes = ["o", "v"];
  if (validModes.indexOf(value) < 0) {
    throw "Invalid mode: " + value;
  }
  return value;
}

exports.modeParser = modeParser;

exports.modesParser = function(value) {
  if (!util.isArray(value)) {
    try {
      value = JSON.parse(value);
    } catch (e) {
      throw "Not a valid modes list: " + value;
    }
  }
  if (!util.isArray(value)) {
    throw "Modes needs to be an array";
  }
  for (var i in value) {
    modeParser(value[i]);
  }
  return value;
};

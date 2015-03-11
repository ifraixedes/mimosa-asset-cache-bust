'use strict';

var crypto = require('crypto');
var packageJSON = require('../package.json');

var mimosaConfigId = packageJSON.config.mimosaConfigId;

exports.defaults = function() {
  var configObj = {};

  configObj[mimosaConfigId] = {
    hash: 'md5',
    splitter: '-',
    files: []
  };

  return configObj;
};

exports.validate = function(config, validators) {
  var moduleConfig = config[mimosaConfigId];
  var defaultConfig = this.defaults();
  var errors = [];
  var configKey;

  if (validators.ifExistsIsObject(errors, mimosaConfigId + ' config', moduleConfig)) {
    if (validators.ifExistsIsString(errors, mimosaConfigId + '.hash', moduleConfig.hash)) {
      try {
        // to check hash algorithm is supported
        crypto.createHash(moduleConfig.hash);
      } catch (e) {
        errors.push(mimosaConfigId + '.hash must specify a hash algorithm supported by NodeJS crypto module');
      }

      validators.ifExistsIsString(errors, mimosaConfigId + '.splitter', moduleConfig.splitter);  
    }
  }

  return errors;
};

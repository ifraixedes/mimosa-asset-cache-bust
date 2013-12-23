'use strict';

var crypto = require('crypto');
var packageJSON = require('../package.json');

var mimosaConfigId = packageJSON.config.mimosaConfigId;

exports.defaults = function() {
  var configObj = {};
  
  configObj = configObj[mimosaConfigId];
  configObj = {
    hash: 'md5' 
  };
 
  return configObj;
};

exports.placeholder = function() {
  return "\t\n\n"+
         "  # " + mimosaConfigId + ":    # Renamed the specified assets files to bust the browser cache\n" +
         "                               # providing an unique file name when they change, using the \n" + 
         "                               # --assetsBusting flag.\n" +
         "    # hash: 'md5'              # String that specify the hash algorithm to use for create file\n" +
         "                               # signature which will be appended to the asset file name; \n" + 
         "                               # 'md5' by default \n" +
         "    # files: [] or / / or ''   # Array with assets file path to bust or a regular expression\n " +
         "                               # otherwise it will be converted to string and a regular\n" + 
         "                               # expression will be created; if it isn't specified then\n" + 
         "                               # no assets files will be busted";
};

exports.validate = function(config, validators) {
  var errors = [];
  var moduleConfig = config[mimosaConfigId];

  if (validators.ifExistsIsObject(errors, mimosaConfigId + ' config', moduleConfig)) {
    if (validators.ifExistIsString(errors, mimosaConfigId + '.hash', moduleConfig.hash)) {
      try {
      // Allows to check hash algorithm is supported
      crypto.createHash(hashAlgorithm);
      } catch (e) {
        errors.push(mimosaConfigId + '.hash must specify a hash algorithm supported by NodeJS crypto module');
      }
    }
  }

  if ((errors.length === 0) && (moduleConfig) && (!moduleConfig.hash)) {
    moduleConfig.hash = 'md5';
  }

  return errors;
};


'use strict';

var crypto = require('crypto');
var packageJSON = require('../package.json');

var mimosaConfigId = packageJSON.config.mimosaConfigId;

exports.defaults = function() {
  var configObj = {};
  
  configObj = configObj[mimosaConfigId];
  configObj = {
    hash: 'md5',
    splitter: '-',
    files: []
  };
 
  return configObj;
};

exports.placeholder = function() {
  return "\t\n\n"+
         "  # " + mimosaConfigId + ":    # Renamed the specified assets files to bust the browser cache\n" +
         "                               # providing an unique file name when they change, using the\n" + 
         "                               # --assetsBusting flag.\n" +
         "    # hash: 'md5'              # String that specify the hash algorithm to use for create file\n" +
         "                               # signature which will be appended to the asset file name;\n" + 
         "                               # 'md5' by default\n" +
         "    # splitter: '-'            # String which specifies the character(s) to use to add between\n" +
         "                               # the file name and the signature; hyphen by default.\n" +
         "    # files: []                # Array with assets file path to bust. Each element must be a\n " +
         "                               # string which must one of the next values:\n" + 
         "                               #  - A full path to a file name\n" + 
         "                               #  - A full path to a directory; it must end with the path\n"
         "                               #    separartor character\n" 
         "                               #  - A full path to a directory followed with a pattern to match\n"
         "                               #    file names into it; so the pattern string must be a string\n"
         "                               #    which the right syntax to build a RegExp object\n"
         "                               # Note: A full path means a path which is resolved from mimosa app";
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

  if (0 === errors.length) {
   for (configKey in defaultConfig) {
     if (undefined === moduleConfig[configKey]) {
       moduleConfig[configKey] = defaultConfig[configKey];
     }
   }
  }

  return errors;
};


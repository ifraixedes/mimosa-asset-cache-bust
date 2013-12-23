'use strict';

var util = require('util');
var bustAssetFiles = require('./bust-asset-files');

var registration = function(mimosaConfig, register) {
    register(['postBuild'], 'beforePackage', bustAssetsFiles);
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};

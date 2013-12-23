'use strict';

var util = require('util');
var config = require('./config');
var bustAssetFiles = require('./bust-assets-files');

var registration = function(mimosaConfig, register) {
    register(['postBuild'], 'beforePackage', bustAssetsFiles);
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};

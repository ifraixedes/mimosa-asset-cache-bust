'use strict';

var config = require('./config');
var bustAssets = require('./bust-assets');

var bustAllAssets = bustAssets.bustAllAssets;
var cleanBustAssets = bustAssets.cleanBustAssets;

function registration(mimosaConfig, register) {
  if (mimosaConfig.isOptimize) {
    register(['postBuild'], 'afterOptimize', function (mimosaConfig, worflowInfo, next) {
      bustAllAssets(mimosaConfig, next);
    });
  }

  register(['postClean'], 'init', function (mimosaConfig, workflowInfo, next) {
    cleanBustAssets(mimosaConfig, next);
  });
}

function registerCommand(program, retrieveConfig) {
    program
    .command('bust-assets')
    .description('Renamed all the assets which match with the rules specified in the module configuration from the compiled directory')
    .action(function() {
      retrieveConfig(true, function(config) {
        bustAllAssets(config);
      }); 
    }); 
}

module.exports = {
  registration: registration,
  registerCommand: registerCommand,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};

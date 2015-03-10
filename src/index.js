'use strict';

var config = require('./config');
var bustAssetsBootstrapper = require('./bust-assets');

function registration(mimosaConfig, register) {
  var bustAssets = bustAssetsBootstrapper(mimosaConfig);
  var bustAllAssets = bustAssets.bustAllAssets;
  var cleanBustAssets = bustAssets.cleanBustAssets;

  if (mimosaConfig.isOptimize) {
    register(['postBuild'], 'afterOptimize', function (mimosaConfig, worflowInfo, next) {
      bustAllAssets(mimosaConfig, next);
    });
  }

  register(['postClean'], 'init', function (mimosaConfig, workflowInfo, next) {
    cleanBustAssets(mimosaConfig, next);
  });
}

function registerCommand(program, logger, retrieveConfig) {
  program
  .command('bust-assets')
  .description('Renamed all the assets which match with the rules specified in the module configuration from the compiled directory')
  .action(function(opts) {
    retrieveConfig({
      buildFirst: true,
      mdebug: !!opts.mdebug
    }, function(config) {
      bustAssetsBootstrapper(config).bustAllAssets(config);
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

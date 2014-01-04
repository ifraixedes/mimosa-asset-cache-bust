'use strict';

var util = require('util');
var config = require('./config');
var bustAssets = require('./bust-assets');

var bustAllAssets = bustAssets.bustAllAssets;
var createBustedAssetFromMatch = bustAssets.createBustedAssetFromMatch;
var removeBustedAssetFromMatch = bustAssets.removeBustedAssetFromMatch;

function registration(mimosaConfig, register) {
    register(['add', 'buildFile', 'buildExtension'], 'beforeWrite', function (mimosaConfig, workflowInfo, next) {
      bustAssets.performActionIfMatch(mimosaConfig, workflowInfo, [createBustedAssetFromMatch], next);
    });
    
    register(['update'], 'beforeWrite', function (mimosaConfig, workflowInfo, next) {
      bustAssets.performActionIfMatch(mimosaConfig, workflowInfo, [removeBustedAssetFromMatch, createBustedAssetFromMatch], next);
    });

    register(['remove'], 'afterDelete', function (mimosaConfig, workflowInfo, next) {
      bustAssets.performActionIfMatch(mimosaConfig, workflowInfo, [removeBustedAssetFromMatch], next);
    });

    register(['cleanFile'], 'beforeDelete', function (mimosaConfig, workflowInfo, next) {
      bustAssets.performActionIfMatch(mimosaConfig, workflowInfo, [removeBustedAssetFromMatch], next);
      next();
    });
}

function registerCommand(program, retrieveConfig) {
//    program
//    .command('bust-assets')
//    .description('Renamed all the assets which match with the rules specified in the module configuration from the compiled directory')
//    .action(function() {
//      retrieveConfig(true, function(config) {
//        //bustAllAssets(config);
//      }); 
//    }); 
}

module.exports = {
  registration: registration,
  registerCommand: registerCommand,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};

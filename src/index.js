'use strict';

var util = require('util');
var config = require('./config');
var bustAssets = require('./bust-assets');

var bustAllAssets = bustAssets.bustAllAssets;
var bustAsset = bustAssets.bustAsset;
var removeBustedAsset = bustAssets.removeBustedAsset;


function registration(mimosaConfig, register) {
  
   //register(['update'], 'beforeWrite', function (mimosaConfig, workflowInfo, next) {
   //  console.log(workflowInfo);
   //});

    
    register(['add', 'buildFile', 'buildExtension'], 'beforeWrite', function (mimosaConfig, workflowInfo, next) {
        bustAsset(mimosaConfig, workflowInfo, next);
    });
    
    register(['update'], 'complete', function (mimosaConfig, workflowInfo, next) {
      console.log(workflowInfo);
      console.log('watch update!!');
      next();
    });

    register(['remove'], 'afterDelete', function (mimosaConfig, workflowInfo, next) {
      //removeBustedAsset(mimosaConfig, workflowInfo, next);
      bustAssets.performActionIfMatch(mimosaConfig, workflowInfo, bustAssets.removeBustedAssetFromMatch, next);
      
    });
    

    register(['cleanFile'], 'beforeDelete', function (mimosaConfig, workflowInfo, next) {
      console.log(workflowInfo);
      next();
    });

    //register(['postBuild'], 'beforePackage', bustAllAssets);
}


function _cleanFileOnDelete(mimosaConfig, workflowInfo, next) {
  var filesRefs = workflowInfo.files;

  if (0 === filesRefs.length) {
    next();
    return;
  }

  filesRefs.forEach(function(fileRef) {
    //fileRef.outputFileName
  });
}

function registerCommand(program, retrieveConfig) {
    program
    .command('bust-assets')
    .description('Renamed all the assets which match with the rules specified in the module configuration from the compiled directory')
    .action(function() {
      retrieveConfig(true, function(config) {
        //bustAllAssets(config);
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

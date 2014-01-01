'use strict';

var util = require('util');
var config = require('./config');
var bustAssetsFiles = require('./bust-assets-files');

function registration(mimosaConfig, register) {
    register(['add', 'update', 'remove'], 'complete', function (mimosaConfig, workflowInfo, next) {
      console.log(workflowInfo);
      next();
    });

    register(['buildFile'], 'beforeWrite', function (mimosaConfig, workflowInfo, next) {
     // console.log(mimosaConfig.watch);
     //console.log(mimosaConfig);
      next();
    });

    register(['postBuild'], 'init', function (mimosaConfig, workflowInfo, next) {
      //console.log('The arguments in afterOptimize are: ', arguments);
      next();
    });

    register(['cleanFile'], 'delete', function (mimosaConfig, workflowInfo, next) {
      //console.log(workflowInfo.files);
      next();
    });

    //register(['postBuild'], 'beforePackage', bustAssetsFiles);
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
        bustAssetsFiles(config, {}, function () {});
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

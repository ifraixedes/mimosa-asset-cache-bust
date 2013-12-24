'use strict';

var util = require('util');
var config = require('./config');
var bustAssetsFiles = require('./bust-assets-files');

var registration = function(mimosaConfig, register) {
    register(['add', 'update', 'remove'], 'complete', function (mimosaConfig, workflowInfo, next) {
      //console.log('The arguments are: ', arguments);
      next();
    });

    register(['postBuild'], 'afterOptimize', function (mimosaConfig, workflowInfo, next) {
      //console.log('The arguments in afterOptimize are: ', arguments);
      next();
    });

    register(['cleanFile'], 'delete', function (mimosaConfig, workflowInfo, next) {
      //console.log(workflowInfo);
      next();
    });

    register(['postBuild'], 'beforePackage', bustAssetsFiles);
};


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

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};

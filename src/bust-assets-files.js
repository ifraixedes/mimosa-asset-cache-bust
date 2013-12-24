'use strict';

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var packageJSON = require('../package.json');
var fileSystemTools = require('./file-system-tools');
var utils = require('./utils');

var moduleName = packageJSON.name;
var mimosaConfigId = packageJSON.config.mimosaConfigId;
var getFilesList = fileSystemTools.getFilesList;
var getFileNameWithSufix = fileSystemTools.getFileNameWithSufix;
var getHashDigester = utils.getHashDigester;

function bustAssetsFiles(mimosaConfig, options, next) {
  var thisModuleConfig = mimosaConfig[mimosaConfigId];
  var digester = getHashDigester(thisModuleConfig.hash);
  var filter;

  if (!thisModuleConfig.files) {
    next();
    return;
  } 

  getFilesList(thisModuleConfig.files, function (err, assetsFilesList) {
    if (err) {
      throw new Error(moduleName + ' failed, error details: ' + err.message);
    }

    renameAssets(assetsFilesList, digester, thisModuleConfig.splitter, function (err) {
      if (err) {
        throw new Error(moduleName + ' failed, error details: ' + err.message);
      } 
    
      next();
    });
  });
}

function renameAssets(assetsFileList, digesterFunc, splitter, callback) {
  var assetsLeft = assetsFileList.length;

  assetsFileList.forEach(function (fileRefObj) {
    fs.readFile(fileRefObj.dir + path.sep + fileRefObj.fileName, function (err, fileContent) {
      digesterFunc(fileContent, function (err, signature) {
        var outputFileName;

        if (0 === assetsLeft) {
          return;
        }

        if (err) {
          assetsLeft = 0;
          callback(err);
          return;
        }

        outputFileName = getFileNameWithSufix(fileRefObj.fileName, splitter + signature);

        fs.rename(fileRefObj.dir + path.sep + fileRefObj.fileName, fileRefObj.dir + path.sep + outputFileName, function (err) {
          if (0 === assetsLeft) {
            return;
          }
        
          if (err) {
            assetsLeft = 0;
            callback(new Error('Error when renaming ' + fileRefObj.dir + path.sep + fileRefObj.fileName + ' to ' + fileRefObj.dir + path.sep + outputFileName));
            return;
          }
          
          assetsLeft--;
          if (0 === assetsLeft) {
            callback(null);
          }
        });

      });
    });
  });
}

module.exports = bustAssetsFiles;

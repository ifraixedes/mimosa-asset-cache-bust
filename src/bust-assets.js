'use strict';

var path = require('path');
var fs = require('fs');
var logger = require('logmimosa');
var packageJSON = require('../package.json');
var fileUtils = require('./file-utils');
var digestUtils = require('./digest-utils');

var moduleName = packageJSON.name;
var mimosaConfigId = packageJSON.config.mimosaConfigId;
var getFilesList = fileUtils.getFilesList;
var getFilesListFromPatterns = fileUtils.getFilesListFromPatterns;
var getFileNameWithSufix = fileUtils.getFileNameWithSufix;
var getFilesListInDirectory = fileUtils.getFilesListInDirectory;
var getPathsFileNamePatterns = fileUtils.getPathsFileNamePatterns;
var getHashDigester = digestUtils.getHashDigester;
var getHashDigesterInfo = digestUtils.getHashDigesterInfo;

var moduleCache = {};

function bustAllAssets(mimosaConfig, next) {
  var thisModuleConfig = mimosaConfig[mimosaConfigId];
  var digester = getHashDigester(thisModuleConfig.hash, 'hex');
  var next = next || function () {};
  var filter;

  if (!thisModuleConfig.files) {
    next();
    return;
  } 
  
  getFilesList(thisModuleConfig.files, mimosaConfig.watch.compiledDir, true, function (err, assetsFilesList) {
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
    fs.readFile(fileRefObj.dir + fileRefObj.fileName, function (err, fileContent) {
      if (err) {
        callback(new Error('Error when reading the content of the file: ' + fileRefObj.dir + fileRefObj.fileName + '. Details: ' + err.message));
        return;
      }

      digesterFunc(fileContent, function (err, signature) {
        var outputFileName;
        
        if (-1 === assetsLeft) {
          return;
        }

        if (err) {
          callback(new Error('Error when working out the hash digest from the file: ' + fileRefObj.dir + fileRefObj.fileName + '. Details: ' + err.message));
          assetsLeft = -1;
          return;
        }

        outputFileName = getFileNameWithSufix(fileRefObj.fileName, splitter + signature);

        fs.rename(fileRefObj.dir + path.sep + fileRefObj.fileName, fileRefObj.dir + path.sep + outputFileName, function (err) {
          if (-1 === assetsLeft) {
            return;
          }

          if (err) {
            assetsLeft = -1;
            callback(new Error('Error when renaming ' + fileRefObj.dir + fileRefObj.fileName + ' to ' + fileRefObj.dir + outputFileName + '. Details: ' + err.message));
            return;
          }

          logger.info(moduleName + ' renamed the file ' + fileRefObj.fileName + ' to ' + outputFileName + ', located in the directory ' + fileRefObj.dir);
          assetsLeft--;

          if (0 === assetsLeft) {
            callback(null);
          }
        });
      });
    });
  });
}

function cleanBustAssets(mimosaConfig, next) {
  var thisModuleConfig = mimosaConfig[mimosaConfigId];
  var next = next || function () {};

  if (!thisModuleConfig.files) {
    next();
    return;
  } 


  getHashDigesterInfo(thisModuleConfig.hash, 'hex', function (err, hashDigesterInfo) {
    var pathsFileNamePatterns;

    if (err) {
      throw new Error(moduleName + ' received an error when getting the information of digest algorithms. Details: ' + err.message);
      return;
    } 

    pathsFileNamePatterns = [];

    getPathsFileNamePatterns(thisModuleConfig.files).forEach(function () {
      var pathsIdx = {};

      return function (pathFilePattern) {
        if (undefined === pathsIdx[pathFilePattern.dir]) {
          pathsIdx[pathFilePattern] = true;
          pathsFileNamePatterns.push({
            dir: pathFilePattern.dir,
            fileNamePattern: new RegExp('.*' + thisModuleConfig.splitter + '[a-zA-Z0-9]{' + hashDigesterInfo.hashLength + ',' + hashDigesterInfo.hashLength + '}')
          });
        }
      };
    }());

    getFilesListFromPatterns(pathsFileNamePatterns, mimosaConfig.watch.compiledDir, true, function (err, assetsFilesList) {
     var digester;

      if (err) {
        throw new Error(moduleName + ' failed, error details: ' + err.message);
      }

      if (0 === assetsFilesList.length) {
        next();
        return;
      }

      digester = getHashDigester(thisModuleConfig.hash, 'hex');

      assetsFilesList.forEach(function(bustedFileObj) {
        var bustedPathFileName =bustedFileObj.dir + bustedFileObj.fileName; 

        fs.readFile(bustedPathFileName, function (err, fileContent) {
          if (err) {
            throw new Error(moduleName + ' failed, when reading the content of the file: ' + bustedPathFileName + '. Details: ' + err.message);
          }

          digester(fileContent, function (err, signature) {
            if (err) {
              throw new Error(moduleName + ' failed, when working out the hash digest from the file: ' + bustedPathFileName + '. Details: ' + err.message);
            }

            if (-1 === bustedFileObj.fileName.indexOf(signature)) {
              logger.warn(moduleName + ' found a busted file which was not geneated by ' + moduleName + '. File path: ' + bustedPathFileName);
              next();
              return;
            }

            fs.unlink(bustedPathFileName, function (err) {
              if (err) {
                throw new Error(moduleName + ' failed when deleting the busted file: ' + bustedPathFileName + '. Details: ' + err.message);
              }

              logger.info(moduleName + ' removed the file : ' + bustedPathFileName); 
              next();
            });
          });
        });
      });
    });
  });
}

module.exports = {
 bustAllAssets: bustAllAssets,
 cleanBustAssets: cleanBustAssets,
};

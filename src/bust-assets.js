'use strict';

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var _ = require('lodash');
var packageJSON = require('../package.json');
var fileUtils = require('./file-utils');
var digestUtils = require('./digest-utils');

var groupBy = _.groupBy;
var moduleName = packageJSON.name;
var mimosaConfigId = packageJSON.config.mimosaConfigId;
var getFilesList = fileUtils.getFilesList;
var getFileNameWithSufix = fileUtils.getFileNameWithSufix;
var getHashDigester = digestUtils.getHashDigester;
var getHashDigesterInfo = digestUtils.getHashDigesterInfo;

var moduleCache = {};

function bustAllAssets(mimosaConfig) {
  var thisModuleConfig = mimosaConfig[mimosaConfigId];
  var digester = getHashDigester(thisModuleConfig.hash, 'hex');
  var filter;

  if (!thisModuleConfig.files) {
    return;
  } 
  
  getFilesList(thisModuleConfig.files, mimosaConfig.watch.compiledDir, function (err, assetsFilesList) {
    if (err) {
      throw new Error(moduleName + ' failed, error details: ' + err.message);
    }

    renameAssets(assetsFilesList, digester, thisModuleConfig.splitter, function (err) {
      if (err) {
        throw new Error(moduleName + ' failed, error details: ' + err.message);
      } 
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

function bustAsset(mimosaConfig, workflowInfo, next) {
  var thisModuleConfig = mimosaConfig[mimosaConfigId];
  var destFolder = mimosaConfig.watch.compiledDir;
  var bustAssetResources;
  
  if (workflowInfo.files && ('string' === typeof destFolder)) {
    bustAssetResources = getBustAssetResources(thisModuleConfig);

    workflowInfo.files.forEach(function (fileObj) {
      var it;
      var subPath;
      var fileName;
      var matchedPath;
      var outputFileName = fileObj.outputFileName;

      if (outputFileName) {
        subPath = outputFileName.substring(outputFileName.indexOf(destFolder) + destFolder.length + 1);
        fileName = path.basename(subPath);
        subPath = subPath.substr(0, subPath.length - fileName.length);
        matchedPath = bustAssetResources.indexedPathsFileNamePatterns[subPath];
        
        if (undefined !== matchedPath) {
          
          for (it = 0; it < matchedPath.length; it++) {
            if ((null === matchedPath[it].fileNamePattern) || matchedPath[it].fileNamePattern.test(fileName))  {
              bustAssetResources.digester(fileObj.outputFileText, function (err, signature) {
                if (err) {
                  throw new Error('Error when working out the hash digest from the file: ' + outputFileName + '. Details: ' + err.message);
                }

                fileObj.outputFileName =  path.dirname(outputFileName) + path.sep + getFileNameWithSufix(fileName, thisModuleConfig.splitter + signature);
                next();
              });
            }
          };
        } else {
          next();
        }
      }
    });
  }

  next();
}

function getBustAssetResources(bustCacheModuleConfig) {
  var pathsFilePatternsRefs;
  
  if (undefined === moduleCache.bustAssetResources) {
    moduleCache.bustAssetResources = {};
    pathsFilePatternsRefs = fileUtils.getPathsFileNamePatterns(bustCacheModuleConfig.files); 
    moduleCache.bustAssetResources.indexedPathsFileNamePatterns = groupBy(pathsFilePatternsRefs, 'dir');
    moduleCache.bustAssetResources.digester = digestUtils.getHashDigester(bustCacheModuleConfig.hash, 'hex');
  }


  return moduleCache.bustAssetResources;
}

function getIndexedPathsFilePatterns(pathsFilePatternsList) {
  var pathsFilePatternsRefs;
  
  if (undefined === moduleCache.indexedPathsFileNamePatterns) {
    pathsFilePatternsRefs = fileUtils.getPathsFileNamePatterns(pathsFilePatternsList); 
    moduleCache.indexedPathsFileNamePatterns = groupBy(pathsFilePatternsRefs, 'dir');
  }

  return moduleCache.indexedPathsFileNamePatterns;
}

module.exports = {
 bustAllAssets: bustAllAssets,
 bustAsset: bustAsset
};

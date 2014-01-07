'use strict';

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var _ = require('lodash');
var logger = require('logmimosa');
var packageJSON = require('../package.json');
var fileUtils = require('./file-utils');
var digestUtils = require('./digest-utils');
var regexpUtils = require('./regexp-utils');

var groupBy = _.groupBy;
var moduleName = packageJSON.name;
var mimosaConfigId = packageJSON.config.mimosaConfigId;
var getFilesList = fileUtils.getFilesList;
var getFilesListFromPatterns = fileUtils.getFilesListFromPatterns;
var getFileNameWithSufix = fileUtils.getFileNameWithSufix;
var getFilesListInDirectory = fileUtils.getFilesListInDirectory;
var tearPathFileName = fileUtils.tearPathFileName;
var getPathsFileNamePatterns = fileUtils.getPathsFileNamePatterns;
var getHashDigester = digestUtils.getHashDigester;
var getHashDigesterInfo = digestUtils.getHashDigesterInfo;
var quoteStringAsRegExp = regexpUtils.quoteStringAsRegExp;

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
  
  getFilesList(thisModuleConfig.files, mimosaConfig.watch.compiledDir, function (err, assetsFilesList) {
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
        callback(Error('Error when reading the content of the file: ' + fileRefObj.dir + fileRefObj.fileName + '. Details: ' + err.message));
        return;
      }

      digesterFunc(fileContent, function (err, signature) {
        var outputFileName;
        
        if (-1 === assetsLeft) {
          return;
        }

        if (err) {
          callback(Error('Error when working out the hash digest from the file: ' + fileRefObj.dir + fileRefObj.fileName + '. Details: ' + err.message));
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
            throw new Error('Error when reading the content of the file: ' + bustedPathFileName + '. Details: ' + err.message);
          }

          digester(fileContent, function (err, signature) {
            if (err) {
              throw new Error('Error when working out the hash digest from the file: ' + bustedPathFileName + '. Details: ' + err.message);
            }

            if (-1 === bustedFileObj.fileName.indexOf(signature)) {
              logger.warn(moduleName + ' found a busted file which was not geneated by ' + moduleName + '. File path: ' + bustedPathFileName);
              next();
              return;
            }

            fs.unlink(bustedPathFileName, function (err) {
              if (err) {
                throw new Error('Error when deleting the busted file: ' + bustedPathFileName + '. Details: ' + err.message);
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

function getBustAssetResources(bustCacheModuleConfig, callback) {
  var pathsFilePatternsRefs;
  
  if (undefined === moduleCache.bustAssetResources) {
    moduleCache.bustAssetResources = {};
    pathsFilePatternsRefs = getPathsFileNamePatterns(bustCacheModuleConfig.files); 
    moduleCache.bustAssetResources.indexedPathsFileNamePatterns = groupBy(pathsFilePatternsRefs, 'dir');
    moduleCache.bustAssetResources.digester = digestUtils.getHashDigester(bustCacheModuleConfig.hash, 'hex');

    getHashDigesterInfo(bustCacheModuleConfig.hash, 'hex', function (err, hashDigesterInfo) {
      if (err) {
        callback(err);
        return;
      } 

      moduleCache.bustAssetResources.digesterInfo = hashDigesterInfo;
      callback(null, moduleCache.bustAssetResources);
    });
  } else {
    callback(null, moduleCache.bustAssetResources);
  }
}

function performActionIfMatch(mimosaConfig, workflowInfo, actions, next) {
  var destFolder = mimosaConfig.watch.compiledDir;

  if (workflowInfo.files && ('string' === typeof destFolder)) {
    getBustAssetResources(mimosaConfig[mimosaConfigId], function (err, bustAssetResources) {
      if (err) {
        throw new Error('Error when getting the bust assets resources. Details: ' + err.message);
      }

      workflowInfo.files.forEach(function (fileObj) {
        var actionsExecuter;
        var it;
        var subPath;
        var matchedPath;
        var outputFileName = fileObj.outputFileName;

        if (outputFileName) {
          subPath = path.dirname(outputFileName.substring(outputFileName.indexOf(destFolder) + destFolder.length + 1)) + path.sep;
          matchedPath = bustAssetResources.indexedPathsFileNamePatterns[subPath];


          if (undefined !== matchedPath) {
            for (it = 0; it < matchedPath.length; it++) {
              if ((null === matchedPath[it].fileNamePattern) || matchedPath[it].fileNamePattern.test(path.basename(outputFileName)))  {
                (actionsExecuter = function () {
                  var action = actions.shift();

                  if (undefined === action) {
                    next();
                  } else {
                    action(mimosaConfig, workflowInfo, bustAssetResources, fileObj, actionsExecuter);
                  }
                })();

                return;
              }
            }
          }
        }

        logger.info(moduleName + ' file not match any specified path file name pattern');
        next();
      });
    });
  }
}

function createBustedAssetFromMatch(mimosaConfig, workflowInfo, bustAssetResources, mimosaFileObj, next) {
  var thisModuleConfig = mimosaConfig[mimosaConfigId];
  var outputFileName = mimosaFileObj.outputFileName;
  
  bustAssetResources.digester(mimosaFileObj.outputFileText, function (err, signature) {
    if (err) {
      throw new Error('Error when working out the hash digest from the file: ' + outputFileName + '. Details: ' + err.message);
    }

    mimosaFileObj.outputFileName =  path.dirname(outputFileName) + path.sep + getFileNameWithSufix(path.basename(outputFileName), thisModuleConfig.splitter + signature);
    next();
  });
}

function removeBustedAssetFromMatch(mimosaConfig, workflowInfo, bustAssetResources, mimosaFileObj, next) {
  var thisModuleConfig = mimosaConfig[mimosaConfigId];
  var destFolder = mimosaConfig.watch.compiledDir;
  var outputFileName = mimosaFileObj.outputFileName;
  var outputPath = path.dirname(outputFileName);
  var subPath = outputFileName.substring(outputFileName.indexOf(destFolder) + destFolder.length + 1);
  var fileName = path.basename(subPath);
  var hashDigestLength = bustAssetResources.digesterInfo.hashLength; 
  var tearedOutputFileName = tearPathFileName(outputFileName);
  var bustedFileNamePattern;
  
  subPath = subPath.substr(0, subPath.length - fileName.length);

if ('' === tearedOutputFileName.ext) {
    bustedFileNamePattern = quoteStringAsRegExp(tearedOutputFileName.name) + quoteStringAsRegExp(thisModuleConfig.splitter) + '[A-Fa-f0-9]{' + hashDigestLength + ',' + hashDigestLength + '}'; 
  } else {
    bustedFileNamePattern = quoteStringAsRegExp(tearedOutputFileName.name) + quoteStringAsRegExp(thisModuleConfig.splitter) + '[A-Fa-f0-9]{' + hashDigestLength + ',' + hashDigestLength + '}\.' + tearedOutputFileName.ext; 
  }

  getFilesListInDirectory(outputPath, new RegExp(bustedFileNamePattern), function (err, filesList) { 
    var bustedPathFileName;

    if (err) {
      logger.warn('Error when locating the busted file of the file: ' + outputFileName + '. Details: ' + err.message);
      next();
      return;
    }

    if (0 === filesList.length) {
      logger.info(moduleName + ' has not found a busted file generated from: ' + mimosaFileObj.outputFileName); 
      next();
      return;
    }

    if (1 < filesList.length) {
      logger.warn(moduleName + ' has found more than one file busted files have been matched, so the removal action has been aborted. Original file output file: ' + fileObj.outputFileName); 
      next();
      return; }

    bustedPathFileName = filesList[0].dir + filesList[0].fileName; 

    fs.readFile(bustedPathFileName, function (err, fileContent) {
      if (err) {
        throw new Error('Error when reading the content of the file: ' + bustedPathFileName + '. Details: ' + err.message);
      }

      bustAssetResources.digester(fileContent, function (err, signature) {
        if (err) {
          throw new Error('Error when working out the hash digest from the file: ' + bustedPathFileName + '. Details: ' + err.message);
        }

        if (-1 === filesList[0].fileName.indexOf(signature)) {
          logger.warn(moduleName + ' found a busted file which was not geneated by ' + moduleName + '. File path: ' + bustedPathFileName);
          next();
          return;
        }

        fs.unlink(bustedPathFileName, function (err) {
          if (err) {
            throw new Error('Error when deleting the busted file: ' + bustedPathFileName + '. Details: ' + err.message);
          }

          logger.info(moduleName + ' removed the file : ' + bustedPathFileName); 
          next();
        });
      });
    });
  });
}


module.exports = {
 bustAllAssets: bustAllAssets,
 cleanBustAssets: cleanBustAssets,
 removeBustedAssetFromMatch: removeBustedAssetFromMatch,
 createBustedAssetFromMatch: createBustedAssetFromMatch,
 performActionIfMatch: performActionIfMatch
};

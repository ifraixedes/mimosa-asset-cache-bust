'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var packageJSON = require('../package.json');

var isArray = util.isArray;
var isRegExp = util.isRegExp;
var moduleName = packageJSON.name;
var mimosaConfigId = packageJSON.config.mimosaConfigId;

function bustAssetsFiles(mimosaConfig, options, next) {
  var signer = getSignerFunction(mimosaConfig[mimosaConfigId].hash);
  var filter;

  if (!mimosaConfig[mimosaConfigId].files) {
    next();
    return;
  } 

  getAssetsFilesList(mimosaConfig[mimosaConfigId].files, function (err, assetsFilesList) {
    if (err) {
      throw new Error(moduleName + ' failed, error details: ' + err.message);
    }

    renameAssets(assetsFilesList, signer, function (err) {
      if (err) {
        throw new Error(moduleName + ' failed, error details: ' + err.message);
      } 
    
      next();
    });
  });
}

function renameAssets(assetsFileList, signerFunc, callback) {
  var assetsLeft = assetsFileList.length;

  assetsFileList.forEach(function (fileRefObj) {
    fs.readFile(fileRefObj.dir + path.sep + fileRefObj.fileName, function (err, fileContent) {
      signerFunc(fileContent, function (err, signature) {
        var outputFileName;

        if (0 === assetsLeft) {
          return;
        }

        if (err) {
          assetsLeft = 0;
          callback(err);
          return;
        }

        outputFileName = getSignedFileName(fileRefObj.fileName, signature);

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

function getAssetsFilesList(pathsAssetsFiles, callback) {
  var assetsFilesList = [];
  var pushAll = assetsFilesList.push;
  var nAsyncCalls = 0;

  if (0 === pathsAssetsFiles.length) {
    callback(null, null);
    return;
  }

  pathsAssetsFiles.forEach(function (pathFile) {
    var idx = pathFile.lastIndexOf(path.sep);
    var patternFileName = null;
    var dir;

    if (idx + 1 === pathFile.length) {
      dir = path.normalize('./' + pathFile);
    } else {
      dir = path.normalize('./' + pathFile.substring(0, idx));
      patternFileName = new RegExp(pathFile.substring(idx + 1, pathFile.length));
    }

    nAsyncCalls++;

    getFilesListInDirectory(dir, patternFileName, function (err, filesList) {
      if (nAsyncCalls < 0) {
        return;
      }
      
      if (err) {
        nAsyncCalls = -1;
        callback(new Error('Error when getting the files list from ' + pathFile + '. Details: ' + err.message));
        return;
      }

      nAsyncCalls--;
      pushAll.apply(assetsFilesList, filesList);

      if (0 === nAsyncCalls) {
        callback(null, assetsFilesList);
      }
    });
  });
}

function getFilesListInDirectory(dirPath, patternFileName, callback) {
  dirPath = path.normalize(dirPath + path.sep);

  fs.readdir(dirPath, function(err, filesList) {
    var nAsyncCalls = filesList.length;
    var onlyFilesList = [];

    if (err) {
      callback(err);
      return;
    }

    filesList.forEach(function (fileName) {
      if ((null === patternFileName) || (patternFileName.test(fileName))) {
        fs.lstat(dirPath + fileName, function (err, stats) {
          if (nAsyncCalls < 0) {
            return;
          }

          if (err) {
            nAsyncCalls = -1;
            callback(err);
            return;
          }

          nAsyncCalls--;
          
          if (stats.isFile()) {
            onlyFilesList.push({
              dir: dirPath, 
              fileName: fileName
            });
          }

          if (0 === nAsyncCalls) {
            callback(null, onlyFilesList);
          }
        });
      } else {
        nAsyncCalls--;
      }
    });

    if (0 === nAsyncCalls) {
      callback(err, onlyFilesList);
      return;
    }
  });
}

function getSignedFileName(fileName, signature) {
  var extFilenameRegExp = new RegExp('([^.]+)(\\..*)?', 'i');
  var fileNameParts;

  fileNameParts = extFilenameRegExp.exec(fileName);

  if (null === fileNameParts) {
    throw new Error('invalid path file name: ' + fileName);
  }

  if (undefined === fileNameParts[2]) {
    return fileNameParts[1] + '-' + signature;
  } else {
    return fileNameParts[1] + '-' + signature + fileNameParts[2];
  }
}

function getSignerFunction(hashAlgorithm) {
  return function (text, callback) {
    var hasher = crypto.createHash(hashAlgorithm);

    try {
      hasher.update(text);
      callback(null, hasher.digest('hex'));
    } catch (e) {
      callback(new Error('file signature process failed with message: ' + e.message));
    }
  };
}

module.exports = bustAssetsFiles;

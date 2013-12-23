'use strict';

var util = require('util');
var path = require('path');
var crypto = require('crypto');
var packageJSON = require('../package.json');

var isArray = util.isArray;
var isRegExp = util.isRegExp;
var moduleName = packageJSON.name;
var mimosaConfigId = packageJSON.config.mimosaConfigId;

function bustAssetsFiles(mimosaConfig, options, next) {
  var signer = getSignerFunction(mimosaConfig[mimosaConfigId].hash);
  var filter;

  if (mimosaConfig[mimosaConfigId].files) {
    filter = getFilterAssetsFiles(mimosaConfig[mimosaConfigId].files);
  } else {
    next();
    return;
  }

  renameAssets(options.files, filter, signer, function (err) {
    if (err) {
      throw new Error(moduleName + ' failed, error details: ' + err.message);
    } else {
      next();
    }
  });
}

function renameAssets(assetsFileList, filterFunc, signerFunc, callback) {
  var assetsLeft = assetsFileList.length;

  //@TODO check if mimosa file object has the path of the file or just the file name
  assetsFileList.forEach(function (fileObj) {
    if (filterFunc(fileObj.inputFileName)) {
     signerFunc(fileObj.outputFileText, function (err, signature) {
       if (0 === assetsLeft) {
         return;
       }
       
       if (err) {
         assetsLeft = 0;
         callaback(err);
         return;
       }

       assetsLeft--;
       fileObj.outputFileName = getSignedFileName(fileObj.outputFileName, signature);

       if (assetsLeft === 0) {
         callback();
       }
     });
    } else {
      assetsLeft--;
    }
  });
}

function getFilterAssetsFiles(filterValue) {
    
  if (isArray(filterValue)) {
    return function (fileName) {
      return (0 >= filterValue.indexOf(fileName)) ? true : false; 
    }

  } else  {
    if (!isRegExp(filterValue)) {
      filterValue = new RegExp(assetsToBust.toString());
    } 

    return function (fileName) {
      return filterValue.match(fileName); 
    }
  }
}

function getSignedFileName(fileFullName, signature) {
  var filePath = path.dirname(fileFullName);
  var extFilenameRegExp = new RegExp('([^.]+)(\\..*)?', 'i');
  var fileNameParts;

  if ('.' === filePath) {
    fileNameParts = fileFullName;
  } else {
    fileNameParts = fileFullName.substring(fileFullName.lastIndexOf(path.sep) + 1);
  }

  fileNameParts = extFilenameRegExp.exec(fileNameParts);

  if (null === fileNameParts) {
    throw new Error('invalid path file name: ' + fileFullName);
  }

  if (undefined === fileNameParts[2]) {
    return filePath + path.sep + fileNameParts[1] + '-' + signature;
  } else {
    return filePath + path.sep.fileNameParts[1] + '-' + signature + fileNameParts[2];
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

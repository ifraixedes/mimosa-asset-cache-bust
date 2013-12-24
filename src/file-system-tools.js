'use strict';

var path = require('path');
var fs = require('fs');

function getFilesList(filePaths, callback) {
  var completeFilesList = [];
  var pushAll = completeFilesList.push;
  var nAsyncCalls = 0;

  if (0 === filePaths.length) {
    callback(null, null);
    return;
  }

  filePaths.forEach(function (pathFile) {
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
      pushAll.apply(completeFilesList, filesList);

      if (0 === nAsyncCalls) {
        callback(null, completeFilesList);
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

function getFileNameWithSufix(fileName, sufix) {
  var extFilenameRegExp = new RegExp('([^.]+)(\\..*)?', 'i');
  var fileNameParts;

  fileNameParts = extFilenameRegExp.exec(fileName);

  if (null === fileNameParts) {
    throw new Error('invalid path file name: ' + fileName);
  }

  if (undefined === fileNameParts[2]) {
    return fileNameParts[1] + sufix;
  } else {
    return fileNameParts[1] + sufix + fileNameParts[2];
  }
}

module.exports = {
  getFilesList: getFilesList,
  getFileNameWithSufix: getFileNameWithSufix
};

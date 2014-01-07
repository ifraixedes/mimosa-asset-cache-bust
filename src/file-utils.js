'use strict';

var path = require('path');
var fs = require('fs');

/**
 * Return a list of references to a files found in the specified file paths, directories and
 * file name patterns.
 *
 * @param {Array} filesPaths Array of string with the files paths to a file or file pattern
 *      (path ended with string regular expression to match the file name) or ended with the
 *      path separator character to specify all the files from a directory.
 * @param {String} [basePath] The path used as root directory where the paths specified in the
 *      filesPaths parameter are referencing. If it isn't provided then empty string is used, so
 *      the files paths should contain absolute directories or relative to the directory 
 *      ```process.pwd()``` as node ```fs``` module does.
 * @param {Function} callback Node convention callback function with a list of object reference 
 *      files found in the specified paths. Each object has two attributes ```dir```, with the
 *      directory path, and ```fileName```.
 */
function getFilesList(filePaths, basePath, ignoreErrNonExistingPaths, callback) {
  var completeFilesList = [];
  var pushAll = completeFilesList.push;
  var nAsyncCalls = 0;

  if (basePath instanceof Function) {
    callback = basePath;
    basePath = '';
  } else {
    if (basePath[basePath.length -1] !== path.sep) {
      basePath += path.sep;
    }
  }

  if (0 === filePaths.length) {
    callback(null, null);
    return;
  }

  filePaths.forEach(function (pathFile) {
    var idx = pathFile.lastIndexOf(path.sep);
    var fileNamePattern = null;
    var dir;

    if (idx + 1 === pathFile.length) {
      dir = path.normalize(basePath + pathFile);
    } else {
      dir = path.normalize(basePath + pathFile.substring(0, idx));
      fileNamePattern = new RegExp(pathFile.substring(idx + 1, pathFile.length));
    }

    nAsyncCalls++;

    getFilesListInDirectory(dir, fileNamePattern, function (err, filesList) {
      if (nAsyncCalls < 0) {
        return;
      }
      
      if (err) {
        if (ignoreErrNonExistingPaths && /^ENOENT/.test(err.message)) {
          nAsyncCalls--;
        } else {
          nAsyncCalls = -1;
          callback(new Error('Error when getting the files list from ' + pathFile + '. Details: ' + err.message));
          return;
        }
      } else {
        nAsyncCalls--;
        pushAll.apply(completeFilesList, filesList);
      }

      if (0 === nAsyncCalls) {
        callback(null, completeFilesList);
      }
    });
  });
}

function getFilesListFromPatterns(pathsFileNamesPatterns, basePath, ignoreErrNonExistingPaths, callback) {
  var completeFilesList = [];
  var pushAll = completeFilesList.push;
  var nAsyncCalls = pathsFileNamesPatterns.length;

  if (0 === nAsyncCalls) {
    callback(null, completeFilesList);
    return;
  }

  pathsFileNamesPatterns.forEach(function (pathFileNamePattern) {
    var dir;
    
    if (basePath) {
      dir = path.normalize(basePath + path.sep + pathFileNamePattern.dir);
    } else {
      dir = pathFileNamePattern.dir;
    }

    getFilesListInDirectory(dir, pathFileNamePattern.fileNamePattern, function (err, filesList) {
      if (nAsyncCalls < 0) {
        return;
      }

      if (err) {
        if (ignoreErrNonExistingPaths && /^ENOENT/.test(err.message)) {
          nAsyncCalls--;
        } else {
          nAsyncCalls = -1;
          callback(new Error('Error when getting the busted files list from ' + dir + '. Details: ' + err.message));
        }
      } else {
        nAsyncCalls--;
        pushAll.apply(completeFilesList, filesList);
      }

      if (0 === nAsyncCalls) {
        callback(null, completeFilesList);
      }
    });
  });
}

function getFilesListInDirectory(dirPath, fileNamePattern, callback) {
  dirPath = path.normalize(dirPath + path.sep);

  fs.readdir(dirPath, function(err, filesList) {
    var nAsyncCalls; 
    var onlyFilesList = [];

    if (err) {
      callback(err);
      return;
    }
    
    nAsyncCalls = filesList.length;

    filesList.forEach(function (fileName) {
      if ((null === fileNamePattern) || (fileNamePattern.test(fileName))) {
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
      callback(null, onlyFilesList);
      return;
    }
  });
}

function getPathsFileNamePatterns(filePaths) {
  var pathFileNamePatterns = [];

  filePaths.forEach(function (pathFile) {
    var idx = pathFile.lastIndexOf(path.sep);
    var fileNamePattern = null;
    var dir = pathFile.substr(0, idx + 1);

    if (idx + 1 < pathFile.length) {
      fileNamePattern = new RegExp(pathFile.substring(idx + 1, pathFile.length));
    }
    
    pathFileNamePatterns.push({
      dir: dir,
      fileNamePattern: fileNamePattern
    });
  });

  return pathFileNamePatterns;
}

function tearPathFileName(fullPathFileName) {
  var parts = {
    path: path.dirname(fullPathFileName),
    ext: path.extname(fullPathFileName)
  };

  if (('.' === parts.path) && (0 !== fullPathFileName[0])) {
    parts.path = '';
  }

  if ('' === parts.ext) {
    parts.name = path.basename(fullPathFileName);
  } else {
    parts.name = path.basename(fullPathFileName);
    parts.name = parts.name.substring(0, parts.name.lastIndexOf(parts.ext));
    parts.ext = parts.ext.substr(1);
  }

  return parts; 
}

function getFileNameWithSufix(fileName, sufix) {
  var fileNameParts = tearPathFileName(fileName);
  var newName;

  if ('' === fileNameParts.path) {
    newName =  fileNameParts.name +  sufix; 
  } else {
    newName = fileNameParts.path + path.sep + fileNameParts.name +  sufix; 
  }

  if ('' !== fileNameParts.ext) {
    newName += '.' + fileNameParts.ext;
  }

  return newName;
}

module.exports = {
  getFilesList: getFilesList,
  getFilesListFromPatterns: getFilesListFromPatterns,
  getPathsFileNamePatterns: getPathsFileNamePatterns, 
  getFilesListInDirectory: getFilesListInDirectory,
  tearPathFileName: tearPathFileName,
  getFileNameWithSufix: getFileNameWithSufix
};

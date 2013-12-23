'use strict';

var path = require('path');

function signAssetsFiles(mimosaConfig, options, next) {
  var assetsToBust = mimosaConfig.assetCacheBust.files;
  var signer = getSignerFunction(mimosaConfig.assetCacheBust.hash);
  var processor;

  if (!assetsToBust) {
    next();
    return;
  }


  if (isArray(assetsToBust)) {
    processor = signAssetsWithArrayFilter;
  } else  {
    if (!isRegExp(assetsToBust)) {
      assetsToBust = new RegExp(assetsToBust.toString());
    } 

    processor = signAssetsWithRegExpFilter;
  } 

  processor(assetsToBust, options.files, signer, function (err) {
    if (err) {
      throw new Error('mimosa-asset-cache-bust failed, error details: ' + err.message);
    } else {
      next();
    }
  });
}

function signAssetsWithArrayFilter(filter, assetsFileList, signerFunc, callback) {
  var renamedAssetsFileNames = [];
  var assetsLeft = assetsFileList.length;

  if ((0 === filter.length) || (0 === assetsLeft)) {
    callback(null, []);
    return;
  }

  //@TODO check if mimosa file object has the path of the file or just the file name

  assetsFileList.forEach(function (fileObj) {
    if (0 >= filter.indexOf(fileObj.inputFileName)) {
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


     });
    } else {
      assetsLeft--;
    }
  });
}

function signAssetsWithRegExpFilter(filter, assetsFileList, signerFunc, callback) {
}

function getSignedFileName(fileFullName, signature) {
  var filePath = path.dirname(fileFullName);
  var fileExt = path.extname(fileFullName);
  var filename;

  //if (filePath)
  //@TODO continue here!!!

  
}

function getSignerFunction(hash) {
  return function (text, callback) {
    callback(null, 'aaa');
  };
}


module.exports = signAssetsFiles;

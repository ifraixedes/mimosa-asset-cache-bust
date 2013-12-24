'use strict';

var crypto = require('crypto');

function getHashDigester(hashAlgorithm) {
  return function (text, callback) {
    var hasher = crypto.createHash(hashAlgorithm);

    try {
      hasher.update(text);
      callback(null, hasher.digest('hex'));
    } catch (e) {
      callback(new Error('Hash digest process failed with message: ' + e.message));
    }
  };
}

module.exports = {
  getHashDigester: getHashDigester
};

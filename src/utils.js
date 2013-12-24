'use strict';

var crypto = require('crypto');

var HASH_TEST_BENCH = {
  inputText: 'This text is for testing the hash algorithms to return the number of fixed characters which generates',
  cache: (function () {
    function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }

    var cache = {};
    
    return {
      get: function (hashAlgorithm) {
        return (undefined === cache[hashAlgorithm]) ? undefined : clone(cache[hashAlgorithm]);
      }, 
      set: function (hashAlgorithm, infoObj) {
        cache[hashAlgorithm] = clone(infoObj);
      }
    };
  }())
};

function getHashDigester(hashAlgorithm, encoding) {
  return function (text, callback) {
    var hasher = crypto.createHash(hashAlgorithm);

    try {
      hasher.update(text);
      callback(null, hasher.digest(encoding));
    } catch (e) {
      callback(new Error('Hash digest process failed with message: ' + e.message));
    }
  };
}

function getHashDigesterInfo(hashAlgorithm, encoding, callback) {
  var digester;
  
  if (undefined === HASH_TEST_BENCH.cache.get(hashAlgorithm)) {
    digester = getHashDigester(hashAlgorithm, encoding);

    digester(HASH_TEST_BENCH.inputText, function (err, hash) {
      if (err) {
        callback(err);
        return;
      }

      HASH_TEST_BENCH.cache.set(hashAlgorithm, {
        hashLength: hash.length
      });

      callback(null, HASH_TEST_BENCH.cache.get(hashAlgorithm));
    });
  } else {
    callback(null, HASH_TEST_BENCH.cache.get(hashAlgorithm));
  }
}

module.exports = {
  getHashDigester: getHashDigester,
  getHashDigesterInfo: getHashDigesterInfo
};

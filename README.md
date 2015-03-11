Mimosa Asset Cache Bust
===========

__WARNING I've stopped to maintain this modules, so I'm happy to move the ownership of this repository if somebody is interested in maintaining it, refer to [this issue](https://github.com/ifraixedes/mimosa-asset-cache-bust/issues/1)__

## Overview

Mimosa module for assets cache busting.

The current release is for Mimosa v3.0, if you would to use it with a previous mimosa version then use for:
- miomsa 2.0 release use [1.0.0](https://github.com/ifraixedes/mimosa-asset-cache-bust/tree/v1.0.0).
- mimosa previous 2.0 release use [0.0.3](https://github.com/ifraixedes/mimosa-asset-cache-bust/tree/v0.0.3).

For more information regarding Mimosa, see http://mimosa.io

## Usage

Add `asset-cache-bust` to your list of modules.  That's all!  Mimosa will install the module for you when you start up.

## Functionality

The module renames the assets left in the compiled directory (`compildedDir` property from `watch` Mimosa configuration section) which match the paths and/or file name patterns from the `files` option configuration of this module.

The module only performs when optimization flag (`-o` or `--optimize`) but it can be run as a mimosa command `mimosa bust-assets`.

Bear in mind the module doesn't provide any mechanism to change the views and/or templates where they are referenced, so it is your task to find out how to update the references; e.g. in server template engine you may have a function that resolve the name depending of your environment and returning each appropriated asset's name base by an id.

## Configuration

### Default

The default configuration added to your mimosa configuration file when the module is installed is:

```
assetCacheBust:
  hash: 'md5'
  splitter: '-'
  files: []
```

### Properties

The default configuration has all the configuration parameters that this module has and they are commented.
Bear in mind that by default the `files` configuration property is an empty array, so it means that any asset will busted.

* hash: It defines the digest algorithm supported by [node crypto API](http://nodejs.org/api/crypto.html#crypto_class_hash) to use to work out a uniquely identifier for each asset regarding its content.
* splitter: The character(s) to use to separate the worked hash digest of the asset from the original name, to be used to rename the asset; if the file has an extension the hash digest will be added between the name and the extension.
* files: A string array of paths with or without a file name pattern to match files in the compilation directory (mimosa `compileDir` property of `watch` section) which have to be busted.
  Path are relative to the compilation directory; when all the assets (files) should be busted from a directory, a path with file name pattern must be defined and to allow to this module to distinguish between them, it must end with '/', bearing in mind that only files in that path are matched, so the descendant directories are skipped, it means that the modules doesn't recurse into subdirectories.
  When only some files or just one should be busted, then a file pattern must be used after the path directory; a file pattern is a string which will be used to create a regular expression (just calling new RegExp constructor), so make sure that when you write them, you scape the regular expression special characters to fit what file names you would like to match.

### Example

Here, you can see an example to set up module; the `files` property matches all the javascript files (files with 'js' extension) are in 'scripts' directory and all the files are in 'stylesheets' directory; remember that those directories are related to the directory compilation 'compileDir'. 

```
assetCacheBust:
  hash: 'sha1'
  splitter: '='
  files: ['script/.*\\.js', 'stylesheets/']
```

## The internals

The module renames the matched files appending to the original name (between the name and the extension), separated by the `splitter` configuration, a hash digest worked out from the content of the file. The digest algorithm to use is defined by the configuration's `hash` property, which must match to a supported hash digest algorithm by [node crypto API](http://nodejs.org/api/crypto.html#crypto_class_hash).

## License

The MIT License, for more information read the [LICENSE file](LICENSE)

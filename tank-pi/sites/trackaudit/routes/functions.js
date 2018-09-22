var config =      require('./config');
var debug =       require('debug')('functions:');
var dns =         require('dns');
var fs =          require('fs');
var Jimp =        require('jimp');
var logistics =   require('./logistics');
var request =     require('request');

var download = function(uri, filename, callback) {
  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
};

/*
** This/these is/are a series of async.waterfall()—compatible wrappers for
** functionality required.
*/

exports.takeSnapshot = function(callback) {
  debug('takeSnapshot() dns lookup...');
  dns.lookup(config.tankHostname, function(err) {
    if (err) {debug('takeSnapshot(): ' + err); callback(null); return;}
    debug('dns.lookup() succeeded');
    if (logistics.trackDataIndex == 0) {logistics.trackDataIndex = 1;}
    var outPath = config.dataFolder + '/' + logistics.trackDataIndex.toString() + '.jpg';
    debug('Downloading to: ' + outPath);
    download(config.tankURL, outPath, function(errDownload) {
      if (errDownload) { console.error('takeSnapshot() download failed: ' + errDownload); callback(errDownload); return;}
      debug('Snapshot downloaded');
      callback(null, 'Successful series');
      logistics.trackDataIndex++;
      return;
    });   // download()
  });     // dns.lookup()
};        // takeSnapshot()

var config =      require('./config');
var debug =       require('debug')('wrappers:');
var fs =          require('fs');
var Jimp =        require('jimp');
var logistics =   require('./logistics');
var prototypes =  require('./prototypes');
var serial =      require('./serial');

/*
** These are a series of async.waterfall()—compatible wrappers for the functions
** found in the prototypes.js file itself. The async module requires a particular
** push/pull model of getting/giving parameters so it was necessary to build these
** wrapper functions.
*/

exports.initFindEdgesGraphic = function(callback) {
  fs.copyFile(config.fileNoImage, config.fileFindEdges, function(errCopy) {
    if (errCopy) {console.error('initFindEdgesGraphic(): ' + errCopy); callback(errCopy); return}
    callback(null);
  });
} // initFindEdgesGraphic()

exports.readSnapshot = function(callback) {
  if (config.useDataFolder) {
    if (logistics.trackDataIndex == 0 || logistics.trackDataIndex == config.dataFolderCount + 1) {
      logistics.trackDataIndex = 1;
    }
    debug('readSnapshot() using data folder');
    try {
      path = config.dataFolder + '/' + logistics.trackDataIndex.toString() + '.jpg';
      debug(path);
      Jimp.read(path, (errRead, imgOut) => {
        if (errRead) {console.error('readSnapshot(): ' + errRead); callback(errRead); return;}
        logistics.sampleX =   0;
        logistics.imgWidth =  imgOut.bitmap.width;
        logistics.imgHeight = imgOut.bitmap.height;
        logistics.sampleY1 =  parseInt(logistics.imgHeight * config.firstY);
        logistics.sampleY2 =  parseInt(logistics.imgHeight * config.secondY);
        logistics.sampleY3 =  parseInt(logistics.imgHeight * config.thirdY);
        callback(null, imgOut);
        logistics.trackDataIndex++;
        return;
      });
    } catch(err) {console.error('readSnapshot() -> catch(): ' + err); callback(err); return;}
  } else {
    // Read it from the static image, as saved into ./public/images/snapshot.jpg
    debug('If data folder is turned on, we should not see this.');
    try {
      Jimp.read(config.fileSnapshot, (errRead, imgOut) => {
        if (errRead) {console.error('readSnapshot(): ' + errRead); callback(errRead); return;}
        logistics.sampleX =   0;
        logistics.imgWidth =  imgOut.bitmap.width;
        logistics.imgHeight = imgOut.bitmap.height;
        logistics.sampleY1 =  parseInt(logistics.imgHeight * config.firstY);
        logistics.sampleY2 =  parseInt(logistics.imgHeight * config.secondY);
        logistics.sampleY3 =  parseInt(logistics.imgHeight * config.thirdY);
        callback(null, imgOut);
        return;
      });
    } catch(err) {console.error('readSnapshot() -> catch(): ' + err); callback(err); return;}
  }
} // readSnapshot()

exports.perspective = function(imgIn, callback) {
  imgIn.perspective(function(err, imgOut) {
    callback(null, imgOut);
  });
} // perspective()

exports.chopTop = function(imgIn, callback) {
  imgIn.chopTop(function(err, imgOut) {
    callback(null, imgOut);
  });
} // chopTop()

exports.markCenter = function(imgIn, callback) {
  imgIn.markCenter(function(err, imgOut) {
    callback(null, imgOut);
  });
} // markCenter()

exports.markFirstSample = function(imgIn, callback) {
  imgIn.markSample(logistics.sampleX, logistics.sampleY1, function(err, imgOut, nLeft, nRight) {
    logistics.nLeft1 =   nLeft;
    logistics.nRight1 =  nRight;
    callback(null, imgOut);
  });
} // markFirstSample()

exports.markSecondSample = function(imgIn, callback) {
  imgIn.markSample(logistics.sampleX, logistics.sampleY2, function(err, imgOut, nLeft, nRight) {
    logistics.nLeft2 =   nLeft;
    logistics.nRight2 =  nRight;
    callback(null, imgOut);
  });
} // markSecondSample()

exports.markThirdSample = function(imgIn, callback) {
  imgIn.markSample(logistics.sampleX, logistics.sampleY3, function(err, imgOut, nLeft, nRight) {
    logistics.nLeft3 =   nLeft;
    logistics.nRight3 =  nRight;
    debug('nLeft: ' + logistics.nLeft1 + '/' + logistics.nLeft2 + '/' + logistics.nLeft3 + ', nRight: ' + logistics.nRight1 + '/' + logistics.nRight2 + '/' + logistics.nRight3);
    logistics.leftFirstSlopeSegment =    parseInt(Math.atan((logistics.nLeft1 - logistics.nLeft2) / parseInt(logistics.imgHeight * (config.firstY - config.secondY))) * 180 / Math.PI);
    logistics.leftSecondSlopeSegment =   parseInt(Math.atan((logistics.nLeft2 - logistics.nLeft3) / parseInt(logistics.imgHeight * (config.secondY - config.thirdY))) * 180 / Math.PI);
    logistics.leftDiff =                 logistics.leftFirstSlopeSegment - logistics.leftSecondSlopeSegment;
    debug('slopeLeft1st: ' + logistics.leftFirstSlopeSegment + ' and slopeLeft2nd: ' + logistics.leftSecondSlopeSegment + ' with difference: ' + logistics.leftDiff);
    logistics.rightFirstSlopeSegment =   parseInt(Math.atan((logistics.nRight2 - logistics.nRight1) / parseInt(logistics.imgHeight * (config.firstY - config.secondY))) * 180 / Math.PI);
    logistics.rightSecondSlopeSegment =  parseInt(Math.atan((logistics.nRight3 - logistics.nRight2) / parseInt(logistics.imgHeight * (config.secondY - config.thirdY))) * 180 / Math.PI);
    logistics.rightDiff =                logistics.rightSecondSlopeSegment - logistics.rightFirstSlopeSegment;
    debug('slopeRight1st: ' + logistics.rightFirstSlopeSegment + ' and slopeRight2nd: ' + logistics.rightSecondSlopeSegment + ' with difference: ' + logistics.rightDiff);
    debug('Straight: ' + (Math.abs(logistics.leftDiff + logistics.rightDiff) < 5));
    if (Math.abs(logistics.leftDiff + logistics.rightDiff) < 5) {
      logistics.trend = 90;
    } else {
      logistics.trend = (Math.abs(logistics.leftDiff) < Math.abs(logistics.rightDiff)) ? logistics.leftFirstSlopeSegment : logistics.rightFirstSlopeSegment;
    }
    if ((Math.abs(logistics.trend) > config.trendSanityCheck && logistics.trend < 90) || isNaN(logistics.trend)) {
      // Looks like we missed some data points and the trend, as calculated, is off
      // Example: nLeft: 10/293/219, nRight: -2/309/51
      // Interpretation: We missed the first data point at 10 (found centerline instead of far left), for example
      // Attempt: trend based upon the other two left-side points which were closer together
      debug('---Trend [' + logistics.trend + '] over sanity check [' + config.trendSanityCheck + '], trying again---');
      debug('nLeft: ' + logistics.nLeft1 + '/' + logistics.nLeft2 + '/' + logistics.nLeft3 + ', nRight: ' + logistics.nRight1 + '/' + logistics.nRight2 + '/' + logistics.nRight3);
      logistics.leftGreatSlopeSegment =    parseInt(Math.atan(Math.abs(logistics.nLeft1 - logistics.nLeft3) / parseInt(logistics.imgHeight * (config.firstY - config.thirdY))) * 180 / Math.PI);
      logistics.rightGreatSlopeSegment =   parseInt(Math.atan(Math.abs(logistics.nRight1 - logistics.nRight3) / parseInt(logistics.imgHeight * (config.thirdY - config.firstY))) * 180 / Math.PI);
      debug('slopeGreatLeft: ' + logistics.leftGreatSlopeSegment + ' and slopeGreatRight: ' + logistics.rightGreatSlopeSegment);
      if (logistics.leftGreatSlopeSegment && logistics.rightGreatSlopeSegment) {
        logistics.trend = 90 - (Math.abs(logistics.leftGreatSlopeSegment) < Math.abs(logistics.rightGreatSlopeSegment) ?
          ((logistics.rightGreatSlopeSegment < 0) ? parseInt(logistics.leftGreatSlopeSegment / 2) : logistics.leftGreatSlopeSegment) :
          logistics.rightGreatSlopeSegment);
      } else {
        if (isNaN(logistics.trend)) {
          debug('---Trend [' + logistics.trend + '] == NaN, trying again---');
          if (isNaN(logistics.nLeft1)) {
            logistics.leftDiff = parseInt(Math.atan((logistics.nLeft2 - logistics.nLeft3) / parseInt(logistics.imgHeight * (config.secondY - config.thirdY))) * 180 / Math.PI);
          } else if (isNaN(logistics.nLeft2)) {
            logistics.leftDiff = parseInt(Math.atan((logistics.nLeft1 - logistics.nLeft3) / parseInt(logistics.imgHeight * (config.firstY - config.thirdY))) * 180 / Math.PI);
          } else if (isNaN(logistics.nLeft3)) {
            logistics.leftDiff = parseInt(Math.atan((logistics.nLeft1 - logistics.nLeft2) / parseInt(logistics.imgHeight * (config.firstY - config.secondY))) * 180 / Math.PI);
          }
          if (isNaN(logistics.nRight1)) {
            logistics.rightFirstSlopeSegment = parseInt(Math.atan((logistics.nRight3 - logistics.nRight2) / parseInt(logistics.imgHeight * (config.secondY - config.thirdY))) * 180 / Math.PI);
          } else if (isNaN(logistics.nRight2)) {
            logistics.rightFirstSlopeSegment = parseInt(Math.atan((logistics.nRight3 - logistics.nRight1) / parseInt(logistics.imgHeight * (config.firstY - config.thirdY))) * 180 / Math.PI);
          } else if (isNaN(logistics.nRight3)) {
            logistics.rightFirstSlopeSegment = parseInt(Math.atan((logistics.nRight2 - logistics.nRight1) / parseInt(logistics.imgHeight * (config.firstY - config.secondY))) * 180 / Math.PI);
          }
          debug('Left: ' + logistics.leftFirstSlopeSegment + ', Right: ' + logistics.rightFirstSlopeSegment + ' combined: ' + parseInt(logistics.leftFirstSlopeSegment + logistics.rightFirstSlopeSegment));
          logistics.trend = 90 - parseInt(logistics.leftFirstSlopeSegment + logistics.rightFirstSlopeSegment);
        } else {
          // One of them was zero, so use the other
          logistics.trend = 90 - (logistics.leftGreatSlopeSegment ? logistics.leftGreatSlopeSegment : logistics.rightGreatSlopeSegment);
        }
      }
    }
    debug('Trend: ' + logistics.trend + ' degrees from horizontal');
    callback(null, imgOut);
  });
} // markThirdSample()

exports.markDirection = function(imgIn, callback) {
  imgIn.markDirection(function(err, imgOut) {
    callback(null, imgOut);
  });
} // markDirection()

exports.sendCommand = function(image, callback) {
  serial.sendCommand(function(err) {
    callback(null, image);
  });
} // markDirection()

exports.writeOutput = function(imgIn, callback) {
  imgIn.write(config.fileFindEdges, function(err) {
    if (err) {console.error('writeOutput(): ' + err); callback(err); return;}
    callback(null, 'Successful series');
  });
} // writeOutput()

/*
** A description of the slope determination
**
** Imagine the following trend line as created from the samples taken at lines 1 (58% of height) and 2 (45% of height) of the image.
** The vertical line would be the centerline as marked by the + in the After graphic. The top of the line represents the location of
** the masking tape on the left at the second sample point; the bottom is the first. Subtracting the X component of each gives us
** what's called the "run" or the adjacent side of a 90-degree triangle whose hypotenuse is that trend line. Subtracting the Y
** components gives us the "rise". Dividing run/rise and adjusting radians to degrees gives us the angle.
**
** |    /
** |   /
** |  /
** | /
** .
*/
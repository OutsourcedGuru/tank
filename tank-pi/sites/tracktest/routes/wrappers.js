var config =      require('./config');
var debug =       require('debug')('wrappers:');
var fs =          require('fs');
var Jimp =        require('jimp');
var logistics =   require('./logistics');
var prototypes =  require('./prototypes');

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
   try {
      Jimp.read(config.fileSnapshot, (errRead, image) => {
        if (errRead) {console.error('readSnapshot(): ' + errRead); callback(errRead); return;}
        logistics.sampleX =   0;
        logistics.sampleY1 =  parseInt(image.bitmap.height * 0.58);
        logistics.sampleY2 =  parseInt(image.bitmap.height * 0.45);
        logistics.sampleY3 =  parseInt(image.bitmap.height * 0.38);
        callback(null, image);
      });
    } catch(err) {console.error('readSnapshot() -> catch(): ' + err); callback(err); return;}
} // readSnapshot()

exports.markCenter = function(imgRaw, callback) {
  imgRaw.markCenter(function(err, image) {
    callback(null, image);
  });
} // markCenter()

exports.markFirstSample = function(img, callback) {
  img.markSample(logistics.sampleX, logistics.sampleY1, function(err, image, nLeft, nRight) {
    logistics.nLeft1 =   nLeft;
    logistics.nRight1 =  nRight;
    callback(null, image);
  });
} // markFirstSample()

exports.markSecondSample = function(img, callback) {
  img.markSample(logistics.sampleX, logistics.sampleY2, function(err, image, nLeft, nRight) {
    logistics.nLeft2 =   nLeft;
    logistics.nRight2 =  nRight;
    callback(null, image);
  });
} // markSecondSample()

exports.markThirdSample = function(img, callback) {
  img.markSample(logistics.sampleX, logistics.sampleY3, function(err, image, nLeft, nRight) {
    logistics.nLeft3 =   nLeft;
    logistics.nRight3 =  nRight;
    debug('nLeft: ' + logistics.nLeft1 + '/' + logistics.nLeft2 + '/' + logistics.nLeft3 + ', nRight: ' + logistics.nRight1 + '/' + logistics.nRight2 + '/' + logistics.nRight3);
    logistics.leftFirstSlopeSegment =    parseInt(Math.atan((logistics.nLeft1 - logistics.nLeft2) / parseInt(image.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
    logistics.leftSecondSlopeSegment =   parseInt(Math.atan((logistics.nLeft2 - logistics.nLeft3) / parseInt(image.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
    logistics.leftDiff =                 logistics.leftFirstSlopeSegment - logistics.leftSecondSlopeSegment;
    debug('slopeLeft1st: ' + logistics.leftFirstSlopeSegment + ' and slopeLeft2nd: ' + logistics.leftSecondSlopeSegment + ' with difference: ' + logistics.leftDiff);
    logistics.rightFirstSlopeSegment =   parseInt(Math.atan((logistics.nRight2 - logistics.nRight1) / parseInt(image.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
    logistics.rightSecondSlopeSegment =  parseInt(Math.atan((logistics.nRight3 - logistics.nRight2) / parseInt(image.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
    logistics.rightDiff =                logistics.rightFirstSlopeSegment - logistics.rightSecondSlopeSegment;
    debug('slopeRight1st: ' + logistics.rightFirstSlopeSegment + ' and slopeRight2nd: ' + logistics.rightSecondSlopeSegment + ' with difference: ' + logistics.rightDiff);
    logistics.trend = (Math.abs(logistics.leftDiff) < Math.abs(logistics.rightDiff)) ? logistics.leftFirstSlopeSegment : logistics.rightFirstSlopeSegment;
    // Unsure if this should be (90-trend) or half of this angle. Also unsure of whether or not I should be subtracting this from 90.
    //debug('Trend: ' + parseInt((90 - logistics.trend) / 2) + ' degrees right of centerline');
    debug('Trend: ' + logistics.trend + ' degrees right of centerline');
    callback(null, image);
  });
} // markThirdSample()

exports.writeOutput = function(img, callback) {
  img.write(config.fileFindEdges, function(err) {
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
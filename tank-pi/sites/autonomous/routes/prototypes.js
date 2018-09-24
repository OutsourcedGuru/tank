var config =      require('./config');
var debug =       require('debug')('prototypes:');
var Jimp =        require('jimp');
var kernels =     require('./kernels');
var logistics =   require('./logistics');

/*
** Most of these are prototype add-ons to the existing Jimp module.
** Note that I'm adding functionality to their class so that I can
** return images like they do, just with new functionality not
** otherwise seen in their code.
*/

(function() {
  // Not strictly a prototype, it's a helper function used internally here
  function colorDiff(colorCheck, colorTarget) {
    var r1, g1, b1, r2, g2, b2;
    r1 = parseInt(colorCheck.substr(0,2), 16);
    g1 = parseInt(colorCheck.substr(2,2), 16);
    b1 = parseInt(colorCheck.substr(4,2), 16);
    r2 = parseInt(colorTarget.substr(0,2), 16);
    g2 = parseInt(colorTarget.substr(2,2), 16);
    b2 = parseInt(colorTarget.substr(4,2), 16);   
    //console.log(colorCheck + ',' + colorTarget + ': [' + r1 + ',' + g1 + ',' + b1 + '][' + r2 + ',' + g2 + ',' + b2 + ']');
    return Math.abs(parseInt(((r2 - r1) + (g2 - g1) + (b2 - b1)) / 3));
  }
  
  Jimp.prototype.perspective = function(cb) {
    var xSkewInRadians =      Math.tan(config.xSkew * Math.PI / 180);
    var xShear =              parseInt(this.bitmap.height * xSkewInRadians);
    var xShearForThisLine =   undefined;
    var original =            this;
    debug('perspective xShear:' + xShear);
    new Jimp(this.bitmap.width, this.bitmap.height, '#000000FF', function(errNew, imgCanvas) {
      if (errNew) {cb(errNew); return;}
      try {
        for (var y=0; y<this.bitmap.height-1; y++) {
          xShearForThisLine = parseInt((y + 1) * xSkewInRadians);
          imgCanvas.blit(
            original.clone().crop(0, y, original.bitmap.width, 1).resize(original.bitmap.width - (2 * xShearForThisLine), 1),
            xShearForThisLine, y
          );  // imgCanvas.blit()
        }     // for
      } finally {
        cb(null, imgCanvas);
      }
    });     // new Jimp()
  };        // perspective()

  Jimp.prototype.chopTop = function(cb) {
    this.crop(0, config.yChop, this.bitmap.width, this.bitmap.height - config.yChop, function(errCrop, imgOut) {
      cb(null, imgOut);
    });     // this.crop()
  };        // chopTop()

  Jimp.prototype.markCenter = function(cb) {
    try {
      Jimp.read('./public/images/center-mark-mask.jpg', (errRead, imgMask) => {
        if (errRead) console.error('Jimp.read(): ' + errRead);
        var midX = parseInt(this.bitmap.width / 2),     midY = parseInt(this.bitmap.height / 2);
        this.mask(imgMask, midX - parseInt(imgMask.bitmap.width / 2), midY - parseInt(imgMask.bitmap.height / 2), function(errMask, imgMasked) {
          if (errMask) console.error('this.mask(): ' + errMask);
          cb(null, imgMasked);
        })
      });
    } catch(err) {console.error('markCenter() Jimp.read() -> catch(): ' + err)};
  }; // markCenter()

  Jimp.prototype.markDirection = function(cb) {
    // Definitively: The logistics.trend value is the degree from the centerline, as measured at the top.
    if (logistics.lastDirection == undefined) logistics.lastDirection = logistics.direction;
    try {
      Jimp.read('./public/images/center-mark-mask.jpg', (errRead, imgMask) => {
        if (errRead) console.error('Jimp.read(): ' + errRead);
        var radiansTrend =    logistics.trend * Math.PI / 180.0;
        var midX =            parseInt((this.bitmap.width / 2) +  (config.trendLineLength * Math.cos(radiansTrend)));
        var midY =            parseInt((this.bitmap.height / 2) + (-1 * config.trendLineLength * Math.sin(radiansTrend)));
        logistics.direction = 90 - logistics.trend;
        debug('direction: ' + logistics.direction + ' degrees from centerline');
        if (logistics.direction - logistics.lastDirection > 20) {
          debug('Wildness detected in steering, titrating that last command...');
          var diff =      logistics.direction - logistics.lastDirection;
          var leftTurn =  (diff < 0) || (logistics.direction < 0 && logistics.lastDirection > 0);
          logistics.direction = (leftTurn) ?
            parseInt(logistics.direction * 0.75) :
            parseInt(logistics.direction * 1.25);
            debug('direction adjusted to: ' + logistics.direction + ' degrees from centerline');
          }
        this.mask(imgMask, midX - parseInt(imgMask.bitmap.width / 2), midY - parseInt(imgMask.bitmap.height / 2), function(errMask, imgMasked) {
          if (errMask) console.error('this.mask(): ' + errMask);
          cb(null, imgMasked);
        })
      });
    } catch(err) {console.error('markDirection() Jimp.read() -> catch(): ' + err)};
  }; // markDirection()

  Jimp.prototype.markSample = function(x, y, cb) {
    var colorTest =   undefined;
    var diff =        undefined;
    var nLeft =       undefined;
    var nRight =      undefined;
    try {
      Jimp.read('./public/images/sample-mark-mask.png', (errRead, imgMask) => {
        if (errRead) console.error('Jimp.read(): ' + errRead);
        Jimp.read('./public/images/sample-vertical-mark.png', (errVRead, imgVMask) => {
          if (errVRead) console.error('Jimp.read(): ' + errVRead);
          this.blit(imgMask, x, y - parseInt(imgMask.bitmap.height / 2), function(errMask, imgMasked) {
            if (errMask) console.error('this.blit(): ' + errMask);
            // Find the left-most lane extent
            for (var i=parseInt(this.bitmap.width / 2); i>0; i--) {
              colorTest = imgMasked.getPixelColor(i, y).toString(16).substr(0,6);
              diff = colorDiff(colorTest, config.colorTarget);
              if (diff < config.colorThreshold) {
                //debug('Left: ' + i + ': ' + colorTest + ' with diff: ' + diff);
                nLeft = parseInt(this.bitmap.width / 2) - i + 10;
                break;
              }
            }
            if (nLeft < config.centerlineWidth) {
              debug('Left: Trying again since we found centerline');
              // nLeft = parseInt(this.bitmap.width / 2); // new
              // Try again since it looks like we found the centerline instead
              for (var i=parseInt(this.bitmap.width / 2) - config.centerlineWidth; i>0; i--) {
                colorTest = imgMasked.getPixelColor(i, y).toString(16).substr(0,6);
                diff = colorDiff(colorTest, config.colorTarget);
                if (diff < config.colorThreshold) {
                  debug('Left: ' + i + ': ' + colorTest + ' with diff: ' + diff);
                  nLeft = parseInt(this.bitmap.width / 2) - i + 10;
                  break;
                }
              }  
            }
            // Find the right-most lane extent
            for (var i=parseInt(this.bitmap.width / 2); i<this.bitmap.width; i++) {
              colorTest = imgMasked.getPixelColor(i, y).toString(16).substr(0,6);
              diff = colorDiff(colorTest, config.colorTarget);
              if (diff < config.colorThreshold) {
                //debug('Right: ' + i + ': ' + colorTest + ' with diff: ' + diff);
                nRight = i - parseInt(this.bitmap.width / 2) - 10;
                break;
              }
            }
            if ((nRight - parseInt(this.bitmap.width / 2)) < config.centerlineWidth) {
              debug('Right: Trying again since we found centerline');
              // nLeft = this.bitmap.width - 1; // new
              // Try again since it looks like we found the centerline instead
              for (var i=parseInt(this.bitmap.width / 2) + config.centerlineWidth; i<this.bitmap.width; i++) {
                colorTest = imgMasked.getPixelColor(i, y).toString(16).substr(0,6);
                diff = colorDiff(colorTest, config.colorTarget);
                if (diff < config.colorThreshold) {
                  debug('Right: ' + i + ': ' + colorTest + ' with diff: ' + diff);
                  nRight = i - parseInt(this.bitmap.width / 2) - 10;
                  break;
                }
              }  
            }
            // We now mark a green vertical line on the left/right of the image
            // indicating where we've identified the track edge. The X value
            // in each case is passed back to the caller for further saving of
            // the logistics.
            imgMasked.blit(imgVMask, parseInt(this.bitmap.width / 2) - nLeft + 7, y - parseInt(imgVMask.bitmap.height / 2), function(errVMask, imgVMasked) {
              if (errVMask) console.error('this.blit(): ' + errVMask);
              imgVMasked.blit(imgVMask, parseInt(this.bitmap.width / 2) + nRight + 8, y - parseInt(imgVMask.bitmap.height / 2), function(errVMaskTwo, imgVMaskedTwo) {
                if (errVMaskTwo) console.error('this.blit(): ' + errVMaskTwo);
                cb(null, imgVMaskedTwo, nLeft, nRight);
              });
            })
          });
        });
      });
    } catch(err) {console.error('markCenter() Jimp.read() -> catch(): ' + err)};
  }; // markSample

}());


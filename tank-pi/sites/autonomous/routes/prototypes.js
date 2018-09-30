var config =      require('./config');
var debug =       require('debug')('prototypes:');
var Jimp =        require('jimp');
var kernels =     require('./kernels');
var logistics =   require('./logistics');

function degToRad(d)  {return d*Math.PI/180};
function squared(n)   {return Math.pow(n,2)};

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
    //debug('perspective xShear:' + xShear);
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

  Jimp.prototype.sharpen = function(cb) {
    this.convolute(kernels.sharpen, function(errConvolute, imgOut) {
      cb(null, imgOut);
    });     // this.convolute()
  };        // sharpen()

  Jimp.prototype.markCenter = function(cb) {
    logistics.imgWidth =   this.bitmap.width;
    logistics.imgHeight =  this.bitmap.height;
    try {
      Jimp.read('./public/images/center-mark-mask.jpg', (errRead, imgMask) => {
        if (errRead) console.error('Jimp.read(): ' + errRead);
        var midX = parseInt(logistics.imgWidth / 2),     midY = parseInt(logistics.imgHeight / 2);
        this.mask(imgMask, midX - parseInt(imgMask.bitmap.width / 2), midY - parseInt(imgMask.bitmap.height / 2), function(errMask, imgMasked) {
          if (errMask) console.error('this.mask(): ' + errMask);
          logistics.centerX = midX; logistics.centerY = midY;
          cb(null, imgMasked);
        })
      });
    } catch(err) {console.error('markCenter() Jimp.read() -> catch(): ' + err)};
  }; // markCenter()

  Jimp.prototype.markDirection = function(cb) {
    // The logistics.trend should be the degree from the horizontal, as measured from the 3 o'clock position.
    // The logistics.direction should be the degree from the centerline, as measure from the 12 o'clock position.
    // if (logistics.lastDirection == undefined) logistics.lastDirection = logistics.direction;
    try {
      Jimp.read('./public/images/center-mark-mask.jpg', (errRead, imgMask) => {
        if (errRead) console.error('Jimp.read(): ' + errRead);
        logistics.direction =   90 - logistics.trend;
        var radiansTrend =      logistics.trend * Math.PI / 180.0;
        var midX =              parseInt((this.bitmap.width / 2) +  (config.trendLineLength * Math.cos(radiansTrend)));
        var midY =              parseInt((this.bitmap.height / 2) + (-1 * config.trendLineLength * Math.sin(radiansTrend)));
        // var radiansTrend =    logistics.trend * Math.PI / 180.0;
        // var midX =            parseInt((this.bitmap.width / 2) +  (config.trendLineLength * Math.cos(radiansTrend)));
        // var midY =            parseInt((this.bitmap.height / 2) + (-1 * config.trendLineLength * Math.sin(radiansTrend)));
        // logistics.direction = 90 - logistics.trend;

        debug('direction: ' + logistics.direction + ' degrees from centerline with trend as: ' + logistics.trend);
        // if (logistics.direction - logistics.lastDirection > 20) {
        //   debug('Wildness detected in steering, titrating that last command...');
        //   var diff =      logistics.direction - logistics.lastDirection;
        //   var leftTurn =  (diff < 0) || (logistics.direction < 0 && logistics.lastDirection > 0);
        //   logistics.direction = (leftTurn) ?
        //     parseInt(logistics.direction * 0.75) :
        //     parseInt(logistics.direction * 1.25);
        //     debug('direction adjusted to: ' + logistics.direction + ' degrees from centerline');
        // }
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

  Jimp.prototype.polarTrend = function(cb) {
    // The logistics.trend should be the degree from the horizontal, as measured from the 3 o'clock position.
    // The logistics.direction should be the degree from the centerline, as measure from the 12 o'clock position.
    try {
      Jimp.read('./public/images/sample-circle-mark.png', (errRead, imgCircle) => {
        if (errRead) console.error('Jimp.read(): ' + errRead);
        Jimp.read('./public/images/sample-lighter-circle-mark.png', (errRead, imgCircleLighter) => {
          if (errRead) console.error('Jimp.read(): ' + errRead);
          //debug('imgWidth: ' + logistics.imgWidth + ', imgHeight: ' + logistics.imgHeight);
          //debug('centerX: ' + logistics.centerX + ', centerY: ' + logistics.centerY);
          //debug('polarSweep: ' + (-1 * config.polarSweep) + ' to ' + config.polarSweep + ' degrees');
          //debug('polarSweepIncrement: ' + config.polarSweepIncrement + ' degrees');
          var angle =         parseInt(-1 * config.polarSweep);
          var angleRadians =  undefined;
          var hypotenuse =    undefined;
          var maxHypotenuse = parseInt(Math.sqrt(squared(logistics.centerX) + squared(logistics.centerY)));
          var x =             undefined;
          var y =             undefined;
          var diff =          undefined;
          var aSweepStats =   [];
          var sumHypotenuse = 0;
          var nLeftVote =     0;
          var nRightVote =    0;
          var avgHypotenuse = undefined;
          try {
            do {
              angleRadians = degToRad(angle);
              //debug('Checking: ' + angle + ' degrees...\t(' + angleRadians + ')');
              // The angleRadians is -/+ (left/right) of the image's vertical centerline,
              // so we need to think of everything as being rotated to the right by 90 degrees. 
              // We need an iterator here for walking away from the center of the graphic,
              // the (growing) hypotenuse-vector of a right triangle with the vertical
              // edge as the centerline. Two trigonometric functions describe the x/y of that
              // triangle (as rotated): x is hyp * sin(angleRadians); y is hyp * cos(angleRadians).
              // Using these as a lookup into the image.getPixelColor(x,y) function, return the
              // color of the sampled pixel and compare this to black, white and yellow or simply
              // not-floor perhaps.
              hypotenuse = 18;
              do {
                x = parseInt(hypotenuse * Math.sin(angleRadians));       // Compensate for the rotation
                y = parseInt(hypotenuse * Math.cos(angleRadians));       // No compensation necessary
                if (logistics.centerY - y < 0) break;
                pixColor = this.getPixelColor(logistics.centerX + x, logistics.centerY - y).toString(16).substr(0,6);
                // Presumably, colorTarget here is the white line's color
                diff = colorDiff(pixColor, config.colorTarget);
                if (diff < config.colorThreshold) {
                  break;
                }
                diff = colorDiff(pixColor, config.colorBlack);
                if (diff < config.blackThreshold) {
                  break;
                }
                hypotenuse += config.polarSweepLengthInc;
              } while (hypotenuse <= maxHypotenuse);
              aSweepStats.push({
                angle:      angle,
                hypotenuse: hypotenuse,
                x:          logistics.centerX + parseInt(hypotenuse * Math.sin(degToRad(angle))) - parseInt(imgCircle.bitmap.width / 2),
                y:          logistics.centerY - parseInt(hypotenuse * Math.cos(degToRad(angle))) - parseInt(imgCircle.bitmap.height / 2)
              });
              sumHypotenuse += hypotenuse;
              angle += parseInt(config.polarSweepIncrement);
            } while (angle <= config.polarSweep);
          } finally {
            avgHypotenuse = sumHypotenuse / aSweepStats.length;
            debug('Average vector: ' + avgHypotenuse);
            aSweepStats.forEach(function(item) {
              if (item.hypotenuse > avgHypotenuse) {
                // We have a sample which is greater than the average, suggesting that it's significant
                // Now tally the -/+ aspect of each to find the winner
                if (item.angle < 0) nLeftVote++; else nRightVote++;
              }
            }); // aSweepStats.forEach()
            debug('nLeftVote: ' + nLeftVote + ', nRightVote: ' + nRightVote);
            logistics.trend = 90 - ((nRightVote - nLeftVote) * 3);  // <-------------------------- This is from the horizontal!
            if (logistics.lastTrend == undefined)  logistics.lastTrend = logistics.trend;
            if (logistics.trend - logistics.lastTrend > 15 || logistics.lastTrend - logistics.trend > 15) {
              debug('Before correction: ' + logistics.trend);
              if (logistics.trend > 90) {
                logistics.trend = parseInt(logistics.trend * 1.25);
              } else {
                logistics.trend = parseInt(logistics.trend * 0.75);
              }
              debug('After correction: ' + logistics.trend);
            }              
            debug('trend: ' + logistics.trend);
            this
              .blit((aSweepStats[0].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[0].x,  aSweepStats[0].y)
              .blit((aSweepStats[1].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[1].x,  aSweepStats[1].y)
              .blit((aSweepStats[2].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[2].x,  aSweepStats[2].y)
              .blit((aSweepStats[3].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[3].x,  aSweepStats[3].y)
              .blit((aSweepStats[4].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[4].x,  aSweepStats[4].y)
              .blit((aSweepStats[5].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[5].x,  aSweepStats[5].y)
              .blit((aSweepStats[6].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[6].x,  aSweepStats[6].y)
              .blit((aSweepStats[7].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[7].x,  aSweepStats[7].y)
              .blit((aSweepStats[8].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[8].x,  aSweepStats[8].y)
              .blit((aSweepStats[9].hypotenuse  > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[9].x,  aSweepStats[9].y)
              .blit((aSweepStats[10].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[10].x, aSweepStats[10].y)
              .blit((aSweepStats[11].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[11].x, aSweepStats[11].y)
              .blit((aSweepStats[12].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[12].x, aSweepStats[12].y)
              .blit((aSweepStats[13].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[13].x, aSweepStats[13].y)
              .blit((aSweepStats[14].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[14].x, aSweepStats[14].y)
              .blit((aSweepStats[15].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[15].x, aSweepStats[15].y)
              .blit((aSweepStats[16].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[16].x, aSweepStats[16].y)
              .blit((aSweepStats[17].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[17].x, aSweepStats[17].y)
              .blit((aSweepStats[18].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[18].x, aSweepStats[18].y)
              .blit((aSweepStats[19].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[19].x, aSweepStats[19].y)
              .blit((aSweepStats[20].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[20].x, aSweepStats[20].y)
              .blit((aSweepStats[21].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[21].x, aSweepStats[21].y)
              .blit((aSweepStats[22].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[22].x, aSweepStats[22].y)
              .blit((aSweepStats[23].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[23].x, aSweepStats[23].y)
              .blit((aSweepStats[24].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[24].x, aSweepStats[24].y)
              .blit((aSweepStats[25].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[25].x, aSweepStats[25].y)
              .blit((aSweepStats[26].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[26].x, aSweepStats[26].y)
              .blit((aSweepStats[27].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[27].x, aSweepStats[27].y)
              .blit((aSweepStats[28].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[28].x, aSweepStats[28].y)
              .blit((aSweepStats[29].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[29].x, aSweepStats[29].y)
              .blit((aSweepStats[30].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[30].x, aSweepStats[30].y)
              .blit((aSweepStats[31].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[31].x, aSweepStats[31].y)
              .blit((aSweepStats[32].hypotenuse > avgHypotenuse) ? imgCircle : imgCircleLighter, aSweepStats[32].x, aSweepStats[32].y,
              function(err, imgOut) {
                cb(null, imgOut);
            });   // this.blit()
          }       // finally
        });       // Jimp.read()
      });         // Jimp.read()
    } catch(err) {console.error('polarTrend() Jimp.read() -> catch(): ' + err); /*cb(err);*/};
  };              // polarTrend

}());


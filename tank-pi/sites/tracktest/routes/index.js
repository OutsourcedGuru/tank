var config =      require('./config');
var express =     require('express');
var fs =          require('fs');
var Jimp =        require('jimp');
var prototypes =  require('./prototypes');
var request =     require('request');
var router =      express.Router();

/*
** Route /
*/
router.get('/', function(req, res, next) {
  fs.copyFile(config.fileNoImage, config.fileFindEdges, function(errCopy) {
    if (errCopy) {         console.error('1st copyFile(): ' + errCopy);      res.render('index', { title: config.title });   return;}
    try {
      Jimp.read(config.fileSnapshot, (errRead, imgRaw) => {
        if (errRead) {     console.error('Read error: ' + errRead);          res.render('index', { title: config.title });   return;};
        imgRaw.markCenter(function(errMask, imgCenter) {
          var sampleX =   0;
          var sampleY1 =  parseInt(imgRaw.bitmap.height * 0.58);
          var sampleY2 =  parseInt(imgRaw.bitmap.height * 0.45);
          var sampleY3 =  parseInt(imgRaw.bitmap.height * 0.38);
          var nLeft1 =    nLeft2 =    nLeft3 =    undefined;
          var nRight1 =   nRight2 =   nRight3 =   undefined;
          imgCenter.markSample(sampleX, sampleY1,                            function(errSample, imgSample,      nLeft, nRight) {
            nLeft1 = nLeft;       nRight1 = nRight;
            imgSample.markSample(sampleX, sampleY2,                          function(errSample, imgSampleTwo,   nLeft, nRight) {
              nLeft2 = nLeft;     nRight2 = nRight;
              imgSampleTwo.markSample(sampleX, sampleY3,                     function(errSample, imgSampleThree, nLeft, nRight) {
                nLeft3 = nLeft;   nRight3 = nRight;
                console.log('nLeft: ' + nLeft1 + '/' + nLeft2 + '/' + nLeft3 + ', nRight: ' + nRight1 + '/' + nRight2 + '/' + nRight3);
                var leftFirstSlopeSegment =    parseInt(Math.atan((nLeft1 - nLeft2) / parseInt(imgRaw.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
                var leftSecondSlopeSegment =   parseInt(Math.atan((nLeft2 - nLeft3) / parseInt(imgRaw.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
                var leftDiff =                 leftFirstSlopeSegment - leftSecondSlopeSegment;
                console.log('slopeLeft1st: ' + leftFirstSlopeSegment + ' and slopeLeft2nd: ' + leftSecondSlopeSegment + ' with difference: ' + leftDiff);
                var rightFirstSlopeSegment =   parseInt(Math.atan((nRight2 - nRight1) / parseInt(imgRaw.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
                var rightSecondSlopeSegment =  parseInt(Math.atan((nRight3 - nRight2) / parseInt(imgRaw.bitmap.height * (0.58 - 0.45))) * 180 / Math.PI);
                var rightDiff =                rightFirstSlopeSegment - rightSecondSlopeSegment;
                console.log('slopeRight1st: ' + rightFirstSlopeSegment + ' and slopeRight2nd: ' + rightSecondSlopeSegment + ' with difference: ' + rightDiff);
                var trend = (Math.abs(leftDiff) < Math.abs(rightDiff)) ? leftFirstSlopeSegment : rightFirstSlopeSegment;
                // Unsure if this should be (90-trend) or half of this angle. Also unsure of whether or not I should be subtracting this from 90.
                //console.log('Trend: ' + parseInt((90 - trend) / 2) + ' degrees right of centerline');
                console.log('Trend: ' + trend + ' degrees right of centerline');
                imgSampleThree.write(           config.fileFindEdges,        function(errWrite) {
                  res.render('index', { title: config.title });
                });          // write()
              });            // markSample()
            });              // markSample()
          });                // markSample()
        });                  // markCenter()
      });                    // Jimp.read()
    } catch(err) {
      console.error('Jimp.read(fileSnapshot) -> catch(): ' + err);
    };                       // try
  });                        // fs.copyFile()
});                          // router.get()

module.exports = router;

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
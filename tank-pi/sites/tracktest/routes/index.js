var async =       require('async');
var config =      require('./config');
var express =     require('express');
var fs =          require('fs');
var Jimp =        require('jimp');
var prototypes =  require('./prototypes');
var request =     require('request');
var wrappers =    require('./wrappers');
var router =      express.Router();

/*
** Route /
*/
router.get('/', function(req, res, next) {
  async.waterfall([
    wrappers.initFindEdgesGraphic,
    wrappers.readSnapshot,
    wrappers.markCenter,
    wrappers.markFirstSample,
    wrappers.markSecondSample,
    wrappers.markThirdSample,
    wrappers.writeOutput
    ], function(errWaterfall, result) {
      if (errWaterfall) {console.error('Waterfall returned err: ', errWaterfall);}
      if (result) {console.log('Waterfall result: ' + result);}
      res.render('index', { title: config.title });
    }
  ) // async.waterfall()
}); // router.get()

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
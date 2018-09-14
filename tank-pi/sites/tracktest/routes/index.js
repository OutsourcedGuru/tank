var async =       require('async');
var config =      require('./config');
var express =     require('express');
var wrappers =    require('./wrappers');
var router =      express.Router();

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

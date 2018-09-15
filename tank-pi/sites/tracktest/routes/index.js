var async =       require('async');
var config =      require('./config');
var debug =       require('debug')('router:');
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
    wrappers.markDirection,
    wrappers.writeOutput
    ], function(errWaterfall, result) {
      if (errWaterfall) {console.error('Waterfall returned err: ', errWaterfall);}
      if (result) {debug('Waterfall result: ' + result);}
      res.render('index', { title: config.title });
    } // callback from async.waterfall()
  )   // async.waterfall()
});   // router.get()

module.exports = router;

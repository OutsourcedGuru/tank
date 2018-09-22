var async =       require('async');
var config =      require('./config');
var debug =       require('debug')('router:');
var express =     require('express');
var fs =          require('fs');
var logistics =   require('./logistics');
var functions =   require('./functions');
var router =      express.Router();

router.get('/', function(req, res, next) {
  async.waterfall([
    functions.takeSnapshot
    ], function(errWaterfall, result) {
      if (errWaterfall) {console.error('Waterfall returned err: ', errWaterfall);}
      if (result) {debug('Waterfall result: ' + result);}
      res.render('index', {title: config.title, reload: config.reloadSeconds, sequence: logistics.trackDataIndex});
    } // callback from async.waterfall()
  )   // async.waterfall()
});   // get('/')

router.get('/start', function(req, res, next) {
  res.render('start');
});   // get('/start')

router.get('/stop', function(req, res, next) {
  res.render('stop', {title: config.title + ' - [Stopped]', url: config.tankStreamURL});
});   // get('/stop')

module.exports = router;

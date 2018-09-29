var async =       require('async');
var config =      require('./config');
var debug =       require('debug')('....router:');
var express =     require('express');
var fs =          require('fs');
var logistics =   require('./logistics');
var serial =      require('./serial');
var wrappers =    require('./wrappers');
var router =      express.Router();

router.get('/', function(req, res, next) {
  async.waterfall([
    wrappers.initFindEdgesGraphic,
    wrappers.readSnapshot,
    wrappers.chopTop,
    wrappers.perspective,
    wrappers.sharpen,
    wrappers.sharpen,
    wrappers.markCenter,
    wrappers.polarTrend,
    // wrappers.markFirstSample,
    // wrappers.markSecondSample,
    // wrappers.markThirdSample,
    wrappers.markDirection,
    wrappers.sendCommand,
    wrappers.writeOutput
    ], function(errWaterfall, result) {
      if (errWaterfall) {console.error('Waterfall returned err: ', errWaterfall);}
      if (result) {debug('Waterfall result: ' + result);}
      res.render('index', {title: config.title, reload: config.reloadSeconds, tankIsDown: config.tankIsDown, sequence: (logistics.trackDataIndex) ? logistics.trackDataIndex - 1 : 0});
    } // callback from async.waterfall()
  )   // async.waterfall()
});   // get('/')

router.get('/end', function(req, res, next) {
  debug('Creating stop.flag to end the race');
  try {fs.closeSync(fs.openSync(process.cwd() + '/stop.flag', 'w'));} catch(err) {}
  res.render('stop', {title: config.title + ' - [Stopped]', url: config.tankStreamURL});
});   // get('/end')

router.get('/start', function(req, res, next) {
  debug('Deleting stop.flag to start the race');
  try {fs.unlinkSync(process.cwd() + '/stop.flag');   fs.unlinkSync(process.cwd() + '/stopping.flag');} catch(err) {}
  res.render('start');
});   // get('/start')

router.get('/stop', function(req, res, next) {
  if (config.tankIsDown) {res.render('stop', {title: config.title + ' - [Stopped]', url: 'images/no-image.jpg'}); return;}
  serial.sendStop(function(err) {
    res.render('stop', {title: config.title + ' - [Stopped]', url: config.tankStreamURL});
  })
});   // get('/stop')

module.exports = router;

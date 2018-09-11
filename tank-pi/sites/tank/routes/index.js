var express =   require('express');
var raspi =     require('raspi');
var Serial =    require('raspi-serial').Serial;
var router =    express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/command', function(req, res, next) {
  if (req.query.left == undefined || req.query.right == undefined) {
    res.json({"status": "syntax error"});
    return;
  }
  // ser = serial.Serial('/dev/serial0', 4800)
  raspi.init(function() {
    var portArduino = new Serial({portId: '/dev/serial0', baudRate: 4800});
    portArduino.open(function(){
      var strCommand =
        'L' + parseInt(Math.round(parseFloat(req.query.left))).toString() +
        ' R' + parseInt(Math.round(parseFloat(req.query.right))).toString() + '\n'; 
      portArduino.write(strCommand);
      console.log('Sent: ' + strCommand);
      res.json({"status": "ok", "left": req.query.left, "right": req.query.right});
    });
  })
});

module.exports = router;

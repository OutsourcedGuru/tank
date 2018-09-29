var config =      require('./config');
var debug =       require('debug')('....serial:');
var dns =         require('dns');
var fs =          require('fs');
var http =        require('http');
var logistics =   require('./logistics');

exports.sendStop = function(callback) {
  debug('Sending stop command...');
  var options = {hostname: 'tank.local',  port: config.tankPort,  path: '/api/command?left=0&right=0',  method: 'GET',  timeout: 5000};
  try {
    http.get(options, function(resp) {
      resp.setEncoding('utf8');
      var data = '';
      resp.on('data',   function(chunk)  {data += chunk;});
      resp.on('error',  function(err)    {debug(err); callback(null); return;});
      resp.on('end',    function()       {debug(data); callback(null); return;});
    });
  } catch(err) {debug(err); callback(null); return;}
} // sendStop()

exports.sendCommand = function(callback) {
  var bStopped = false;
  debug('Finding tank...');
  var host = config.tankHostname;
  if (config.tankIsDown) host = 'localhost';
  dns.lookup(host, function(err) {
    if (err) {debug(err); callback(null); return;}
    var w = logistics.imgWidth,   mid_w = w / 2,   mouseOffset_x = 0;
    var h = logistics.imgHeight,  mid_h = h / 2,   mouseOffset_y = 0;
    var options = {hostname: 'tank.local',  port: config.tankPort,  path: '',  method: 'GET',  timeout: 5000};
    /*
    ** --------------------------------------------------------------------
    ** Stop [x] Reasonably done, but probably needs to be mapped
    ** --------------------------------------------------------------------
    */
    fs.access(process.cwd() + '/stop.flag', fs.constants.F_OK, function(err1) {
      if (err1 == null) {
        bStopped = true;
        debug('┌───────────────────────────────────────────────────────┐');
        debug('│   Tank is stopped. Press "Start Race" button to go.   │');
        debug('└───────────────────────────────────────────────────────┘');
        if (!config.verbose) {
          callback(null);
          return;
        }
      }
      fs.access(process.cwd() + '/stopping.flag', fs.constants.F_OK, function(err2) {
        if (err2 == null) {
          debug('Creating a stop.flag');
          // Upgrade from stopping.flag to stop.flag so that we only trigger once
          fs.closeSync(fs.openSync(process.cwd() + '/stop.flag', 'w'));
          fs.unlinkSync(process.cwd() + '/stopping.flag');
          // Send the stop command to the tank
          options.path = '/api/command?left=0&right=0';
          try {
            http.get(options, function(resp) {
              resp.setEncoding('utf8');
              var data = '';
              resp.on('data',   function(chunk)  {data += chunk;});
              resp.on('error',  function(err)    {debug(err); callback(null); return;});
              resp.on('end',    function()       {debug(data); callback(null); return;});
            });
          } catch(err) {debug(err); callback(null); return;}
        } else {
          /*
          ** --------------------------------------------------------------------
          ** Straight-driving [ ] Needs to be mapped into 0-255 (overshooting)
          ** --------------------------------------------------------------------
          */
          if (Math.abs(logistics.direction) < 4) {
            nLeft = nRight = config.defaultStraightSpeed;
            options.path = '/api/command?left=' + nLeft + '&right=' + nRight;
            debug('path: ' + options.path);
            if (!bStopped) {
              try {
                http.get(options, function(resp) {
                  resp.setEncoding('utf8');
                  var data = '';
                  resp.on('data',   function(chunk)  {data += chunk;});
                  resp.on('error',  function(err)    {debug(err); callback(null); return;});
                  resp.on('end',    function()       {debug(data); callback(null); return;});
                });
              } catch(err) {debug(err); callback(null); return;}
            } else {callback(null); return;}
          }
          /*
          ** --------------------------------------------------------------------
          ** Gradual turns
          ** --------------------------------------------------------------------
          */
          debug('Gradual turn with direction: ' + logistics.direction + ' degrees from centerline');
          if (logistics.direction > 0) {
            debug('QI');
            nLeft =    config.defaultCurveSpeed;
            nRight =   parseInt(nLeft * ((100 - logistics.direction) / 100));
          } else {
            debug('QIV');
            nRight =   config.defaultCurveSpeed;
            nLeft =    parseInt(nRight * ((100 + logistics.direction) / 100));
          }
          options.path = '/api/command?left=' + nLeft + '&right=' + nRight;
          debug('path: ' + options.path);
          if (!bStopped) {
            try {
              http.get(options, function(resp) {
                resp.setEncoding('utf8');
                var data = '';
                resp.on('data',   function(chunk)  {data += chunk;});
                resp.on('error',  function(err)    {debug(err); callback(null); return;});
                resp.on('end',    function()       {debug(data); callback(null); return;});
              });
            } catch(err) {debug(err); callback(null); return;}
          } else {callback(null); return;}
        }  // else from fs.access() stopping.flag
      });  // fs.access() stopping.flag
    });    // fs.access() stop.flag
  });      // dns.lookup()
}          // sendCommand()
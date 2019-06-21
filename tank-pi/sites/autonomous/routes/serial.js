var config =      require('./config');
var debug =       require('debug')('....serial:');
var dns =         require('dns');
var fs =          require('fs');
var http =        require('http');
var logistics =   require('./logistics');

exports.sendStop = function(callback) {
  debug('sendStop()...');
  var options = {hostname: 'tank.local',  port: config.tankPort,  path: '/api/command?left=0&right=0',  method: 'GET',  timeout: 5000};
  try {
    http.get(options, function(resp) {
      resp.setEncoding('utf8');
      var data = '';
      resp.on('data',   function(chunk)  {data += chunk;});
      resp.on('error',  function(err)    {debug(err); return;});
      resp.on('end',    function()       {debug(data); return;});
    });
  } catch(err) {debug(err); return;} finally { callback(null); }
} // sendStop()

exports.sendCommand = function(callback) {
  if (config.tankIsDown) {callback(null); return;}
  var bStopped = false;
  debug('sendCommand() Finding tank...');
  var host = config.tankIsDown ? 'localhost' : config.tankHostname;
  dns.lookup(host, function(err) {
    if (err) {debug(err); callback(null); return;}
    var w = logistics.imgWidth,   mid_w = w / 2,   mouseOffset_x = 0;
    var h = logistics.imgHeight,  mid_h = h / 2,   mouseOffset_y = 0;
    var options = {hostname: (config.tankIsDown ? 'localhost' : 'tank.local'),  port: config.tankPort,  path: '',  method: 'GET',  timeout: 5000};
    /*
    ** --------------------------------------------------------------------
    ** Stop because button was pressed (earlier or just now)
    ** --------------------------------------------------------------------
    */
    var EXISTS = null;
    fs.access(process.cwd() + '/stop.flag', fs.constants.F_OK, function(outcomeReadStopFlag) {
      if (outcomeReadStopFlag == EXISTS) {
        bStopped = true;
        debug('┌───────────────────────────────────────────────────────┐');
        debug('│   Tank is stopped. Press "Start Race" button to go.   │');
        debug('└───────────────────────────────────────────────────────┘');
        if (!config.verbose) {
          debug('sendCommand() doing callback at if (!config.verbose)...');
          callback(null);
          return;
        }
      } else {
        // The stop flag does not exist
        fs.access(process.cwd() + '/stopping.flag', fs.constants.F_OK, function(outcomeReadStoppingFlag) {
          if (outcomeReadStoppingFlag == EXISTS) {
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
                resp.on('error',  function(err)    {debug(err); return;});
                resp.on('end',    function()       {debug(data); return;});
              });
            } catch(err) {debug(err); return;} finally { debug('sendCommand() in callback() due to stopping flag'); callback(null); }
          } else {
            // The stopping flag does not exist
            /*
            ** --------------------------------------------------------------------
            ** Straight-driving [ ] Needs to be mapped into 0-255 (overshooting)
            ** --------------------------------------------------------------------
            */
            if (Math.abs(logistics.direction) < 4) {
              nLeft = nRight = config.defaultStraightSpeed;
              options.path = '/api/command?left=' + nLeft + '&right=' + nRight;
              debug('straight path: ' + options.path); // <--------------------
              if (!bStopped) {
                try {
                  http.get(options, function(resp) {
                    resp.setEncoding('utf8');
                    var data = '';
                    resp.on('data',   function(chunk)  {data += chunk;});
                    resp.on('error',  function(err)    {debug(err); return;});
                    resp.on('end',    function()       {debug(data); return;});
                  });
                } catch(err) {debug(err); return;} finally { callback(null); }
              } else {callback(null); return;}
            } else {
              // Not straight path
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
              debug('gradual turn path: ' + options.path); // <--------------------
              if (!bStopped) {
                try {
                  http.get(options, function(resp) {
                    resp.setEncoding('utf8');
                    var data = '';
                    resp.on('data',   function(chunk)  {data += chunk;});
                    resp.on('error',  function(err)    {debug(err); return;});
                    resp.on('end',    function()       {debug(data); return;});
                  });
                } catch(err) {debug(err); return;} finally { callback(null); }
              } else {callback(null); return;}
            } // else from if (Math.abs(logistics.direction) < 4)
          }   // else from if (outcomeReadStoppingFlag == EXISTS)
        });   // fs.access() stopping.flag
      }       // else from if (outcomeReadStopFlag == EXISTS)
    });       // fs.access() stop.flag
  });         // dns.lookup()
}             // sendCommand()
exports.title =                 'Autonomous Tank';
exports.tankURL =               'http://tank.local:8080/?action=snapshot';
exports.tankStreamURL =         'http://tank.local:8080/?action=stream';
exports.tankHostname =          'tank.local';
exports.tankPort =              80;       // tcp port for http
exports.fileNoImage =           './public/images/no-image.jpg';
exports.fileFindEdges =         './public/images/find-edges.jpg';
exports.fileSnapshot =          './public/images/snapshot.jpg';
exports.useDataFolder =         true;     // set to true for development purposes when the tank is down - default: false
exports.dataFolder =            './public/images/data';
exports.dataFolderCount =       155;      // Number of files in the dataFolder directory
exports.colorTarget =           'ffffff'; // color of the lane marker masking tape, as seen by the target webcam at the sampled lighting
exports.colorThreshold =        25;       // a per-primary-color difference - default: 25
exports.colorBlack =            '000000'; // boundaries of the perspective transformation - default: '000000'
exports.blackThreshold =        20;       // a per-primary-color difference for black - default: 20
exports.trendLineLength =       100;      // distance from center in pixels of the trend "+" symbol to indicate trend - default: 100
exports.trendSanityCheck =      48;       // degrees from centerline, used in horizontal sampling trend version
exports.firstY =                0.58;     // percent of height, from top of graphic, used in horizontal sampling trend version
exports.secondY =               0.45;     // percent of height, from top of graphic, used in horizontal sampling trend version
exports.thirdY =                0.38;     // percent of height, from top of graphic, used in horizontal sampling trend version
exports.centerlineWidth =       40;       // width of track dashed yellow centerline to offset in recalculations, if seen
exports.defaultStraightSpeed =  255;      // 50 is approximately the minimum - default: 255
exports.defaultCurveSpeed =     200;      // 80 is approximately the practical minimum - default: 200
exports.reloadSeconds =         0;        // set to 1 for a race or 5 for training purposes with a slow default speed - default: 1
exports.verbose =               true;     // in serial.js, allows calculations to continue after bStopped has been determined - default: false
exports.tankIsDown =            true;     // set this if you're just developing and the tank is expected to be offline - default: false
exports.xSkew =                 30;       // (degrees) set this to the amount to adjust the top of the graphic outward on both sides, used in perspective trasform
exports.yChop =                 200;      // pixels to chop from the top since it's beyond the track horizon, used in the chopTop transform
exports.polarSweep =            80;       // +/- range of polar sweep trend detection
exports.polarSweepIncrement =   5;        // increment in degrees for polar sweep trend detection
exports.polarSweepLengthInc =   1;        // increment in pixels for the hypotenuse in the polar sweep trend detection

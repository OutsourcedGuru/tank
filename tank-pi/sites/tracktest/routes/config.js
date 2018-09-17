exports.title =                 'Autonomous Tank - tracktest';
exports.tankURL =               'http://tank.local:8080/?action=snapshot';
exports.tankStreamURL =         'http://tank.local:8080/?action=stream';
exports.tankHostname =          'tank.local';
exports.fileNoImage =           './public/images/no-image.jpg';
exports.fileFindEdges =         './public/images/find-edges.jpg';
exports.fileSnapshot =          './public/images/snapshot.jpg';
exports.useDataFolder =         true;
exports.dataFolder =            './public/images/data';
exports.dataFolderCount =       9;        // Number of files in the dataFolder directory
exports.colorTarget =           'dce6ce'; // color of the lane marker masking tape, as seen by the target webcam at the sampled lighting
exports.colorThreshold =        75;       // a per-primary-color difference
exports.trendLineLength =       100;      // long enough to be seen over the third horizontal sample line
exports.trendSanityCheck =      48;       // degrees from centerline
exports.firstY =                0.58;     // percent of height, from top of graphic
exports.secondY =               0.45;     // percent of height, from top of graphic
exports.thirdY =                0.38;     // percent of height, from top of graphic
exports.centerlineWidth =       40;       // width of centerline to offset in recalculations, if seen
exports.defaultStraightSpeed =  80;       // 50 is approximately the minimum
exports.defaultCurveSpeed =     80;       // 80 is approximately the practical minimum
exports.reloadSeconds =         0;        // set to 3 for a race or 5 for training purposes with a slow default speed
exports.verbose =               true;     // in serial.js, allows calculations to continue after bStopped has been determined

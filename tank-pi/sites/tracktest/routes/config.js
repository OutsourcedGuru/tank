exports.title =                 'Autonomous Tank - tracktest';
exports.tankURL =               'http://tank.local:8080/?action=snapshot';
exports.tankStreamURL =         'http://tank.local:8080/?action=stream';
exports.tankHostname =          'tank.local';
exports.fileNoImage =           './public/images/no-image.jpg';
exports.fileFindEdges =         './public/images/find-edges.jpg';
exports.fileSnapshot =          './public/images/snapshot.jpg';
exports.fileCropMidway =        './public/images/crop-midway.jpg';
exports.colorTarget =           'dce6ce'; // color of the lane marker masking tape, as seen by the target webcam at the lighting sampled
exports.colorThreshold =        75;
exports.trendLineLength =       100;
exports.trendAngleMultiplier =  1.0;
exports.trendSanityCheck =      60;
exports.firstY =                0.58;
exports.secondY =               0.45;
exports.thirdY =                0.38;
exports.defaultStraightSpeed =  60;
exports.defaultCurveSpeed =     60;


var config =      require('./config');
var express =     require('express');
var fs =          require('fs');
var Jimp =        require('jimp');
var kernels =     require('./kernels');
var request =     require('request');
var router =      express.Router();
var preKernel =   undefined;
var postKernel =  undefined;
var imageWidth =  640;
var imageHeight = 480;
/*
** Functions
*/
var download = function(uri, filename, callback) {
  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
};
var setKernelsOptions = function(pre, post, edgeA, edgeB) {
  switch (pre) {
    case 'blur':          preKernel = kernels.blur;               break;
    case 'sharpen':       preKernel = kernels.sharpen;            break;
    case 'bold':          preKernel = kernels.bold;               break;
    case 'inc-contrast':  preKernel = kernels.increaseContrast;   break;
    case 'dec-contrast':  preKernel = kernels.decreaseContrast;   break;
    default:              preKernel = kernels.identity;
  }
  switch (post) {
    case 'blur':          postKernel = kernels.blur;              break;
    case 'sharpen':       postKernel = kernels.sharpen;           break;
    case 'bold':          postKernel = kernels.bold;              break;
    case 'inc-contrast':  postKernel = kernels.increaseContrast;  break;
    case 'dec-contrast':  postKernel = kernels.decreaseContrast;  break;
    default:              postKernel = kernels.identity;
  }
  if (edgeA) {
    kernels.findEdges[0][0] =   kernels.findEdges[0][1] = kernels.findEdges[0][1] =
      kernels.findEdges[1][0] = kernels.findEdges[1][2] =
      kernels.findEdges[2][0] = kernels.findEdges[2][1] = kernels.findEdges[2][2] = edgeA;
    kernels.findEdges[1][1] = edgeB;
  }
} // setKernelOptions()
function saveLogistics(imgCropped) {
  //imgCropped.crop(  0, 1, imageWidth, 1, function(errTopCrop,    imgTopCrop) {     // Grab a 1-pixel slice across the top
    //imgCropped.crop(0, 9, imageWidth, 1, function(errBottomCrop, imgBottomCrop) {  // Grab a 1-pixel slice across the bottom
  var topLeftMargin =   0;
  var topRightMargin =  0;
  var color =           undefined;
  var threshold =       parseInt(0x808080FF);
  var lineArray =       [];
  // First, let's make a copy of the line in an array
  for (var i=0; i<imageWidth-1; i++) {
    color = parseInt(imgCropped.getPixelColor(i, 1).toString(16),16); // .substr(0,6)
    lineArray.push(color);
  }
  lineArray[0] = lineArray[imageWidth-1] = 255;
  // Let's remove some of the random noise in the line array
  for (var i=0; i<imageWidth-1; i++) { // If black either side, remove middle color
    if (i && i<imageWidth-2) {
      var colorBefore = lineArray[i-1];
      var colorThis =   lineArray[i];
      var colorAfter =  lineArray[i+1];
      if (colorThis > 256 && colorBefore < 256 && colorAfter < 256) {lineArray[i] = 255;}
    }
  }
  for (var i=0; i<imageWidth-1; i++) { // If black either side, remove middle color
    if (i && i<imageWidth-2) {
      var colorBefore = lineArray[i-1];
      var colorThis =   lineArray[i];
      var colorAfter =  lineArray[i+1];
      if (colorThis > 256 && colorBefore < 256 && colorAfter < 256) {lineArray[i] = 255;}
    }
  }
  for (var i=0; i<imageWidth-2; i++) { // If black either side, remove middle color of a two-wide strip
    if (i && i<imageWidth-2) {
      var colorBefore = lineArray[i-1];
      var colorThis =   lineArray[i];
      var colorAfter =  lineArray[i+2];
      if (colorThis > 256 && lineArray[i+1] > 256 && colorBefore < 256 && colorAfter < 256) {lineArray[i] = lineArray[i+1] = 255;}
    }
  }
  for (var i=0; i<imageWidth-1; i++) { // If white either side, add white to middle
    if (i && i<imageWidth-2) {
      var colorBefore = lineArray[i-1];
      var colorThis =   lineArray[i];
      var colorAfter =  lineArray[i+1];
      if (colorThis < 256 && colorBefore > 256 && colorAfter > 256) {lineArray[i] = parseInt(0xFFFFFFFF);}
    }
  }
  // Walk left-to-right, stop if the 3-pixel average is above the threshold
  for (var i=0; i<imageWidth-3; i++) {
    var threesome = lineArray[i] + lineArray[i+1] + lineArray[i+2];
    //if (lineArray[i] > 280000000 && threesome > 450000000) break;
    if (threesome > 450000000) break;
    topLeftMargin++;
  }
  // Walk right-to-left, stop if the 3-pixel average is above the threshold
  for (var i=imageWidth-1; i>2; i--) {
    var threesome = lineArray[i] + lineArray[i-1] + lineArray[i-2];
    // if (lineArray[i] > 280000000 && threesome > 450000000) break;
    if (threesome > 450000000) break;
    topRightMargin++;
  }
  console.log('Top left margin: ' + topLeftMargin + ' and top right margin: ' + topRightMargin);
} // saveLogistics()
/*
** Route /
*/
router.get('/', function(req, res, next) {
  fs.copyFile(config.fileNoImage, config.fileFindEdges, function(errCopy) {
    if (errCopy) {         console.error('1st copyFile(): ' + errCopy);      res.render('index', { title: config.title });   return;}
    fs.copyFile(config.fileNoImage, config.fileSnapshot, function(err2ndCopy) {
      if (err2ndCopy) {    console.error('2nd copyFile(): ' + err2ndCopy);   res.render('index', { title: config.title });   return;}
      download(config.tankURL, config.fileSnapshot, function(errDownload) {
        if (errDownload) { console.error('Download failed: ' + errDownload); res.render('index', { title: config.title });   return;}
        console.log('Snapshot downloaded');
        try {
          Jimp.read(config.fileSnapshot, (errRead, image) => {
            if (errRead) {   console.error('Read error: ' + errRead);        res.render('index', { title: config.title });   return;};
            setKernelsOptions(req.query.pre, req.query.post, req.query.edgeA, req.query.edgeB);
            image.greyscale(                                                         function(errConvolute, imgGrey) {
              imgGrey.convolute(              preKernel,                             function(errConvolute, imgFirst) {
                imgFirst.convolute(           kernels.findEdges,                     function(errConvolute, imgSecond) {
                  imgSecond.convolute(        postKernel,                            function(errConvolute, imgThird) {
                    imgThird.write(           config.fileFindEdges,                  function(errWrite) {
                      imgThird.crop( 0, parseInt(imageHeight * 0.9), imageWidth, 10, function(errCrop, imgCropMidway) {  // Grab a 10-pixel tall slice from mid-way down
                        imgCropMidway.write(  config.fileCropMidway,                 function(errWriteCrop) {
                          saveLogistics(imgCropMidway);
                          // Jimp.read('./public/images/test-slice.jpg', (errRead, imgTest) => {
                          //   saveLogistics(imgTest);
                          res.render('index', { title: config.title });
                          // }); // .read()
                        });  // imgCropMidway.write()
                      });    // crop()
                    });      // imgThird.write()
                  });        // third convolute()
                });          // second convolute()
              });            // first convolute()
            });              // greyscale()
          });                // Jimp.read()
        } catch {};          // try
      });                    // download()
    });                      // fs.copyFile()
  });                        // fs.copyFile()
});                          // router.get()

module.exports = router;

/*
1. Compute the camera calibration matrix and distortion coefficients.
2. Apply a distortion correction to raw images.
3. Use color transforms, gradients, etc., to create a thresholded binary image.
4. Apply a perspective transform to generate a “bird’s-eye view” of the image.
5. Detect lane pixels and fit to find the lane boundary.
6. Determine the curvature of the lane and vehicle position with respect to center.
7. Warp the detected lane boundaries back onto the original image and display numerical estimation of lane curvature and vehicle position.
*/
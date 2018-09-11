var express =   require('express');
var fs =        require('fs');
var Jimp =      require('jimp');
var request =   require('request');
var router =    express.Router();


var download = function(uri, filename, callback) {
  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
};

/* GET home page. */
router.get('/', function(req, res, next) {
  fs.copyFile('./public/images/no-image.jpg', './public/images/find-edges.jpg', function(errCopy) {
    if (errCopy) {
      console.error('Initial copyFile() returned: ' + errCopy);
      res.render('index', { title: 'Autonomous Tank' });
      return;
    }
    fs.copyFile('./public/images/no-image.jpg', './public/images/snapshot.jpg', function(err2ndCopy) {
      if (err2ndCopy) {
        console.error('Initial 2nd copyFile() returned: ' + err2ndCopy);
        res.render('index', { title: 'Autonomous Tank' });
        return;
      }
      download('http://tank.local:8080/?action=snapshot', './public/images/snapshot.jpg', function(errDownload) {
        if (errDownload) {
          console.error('Download of snapshot failed with error: ' + errDownload);
          res.render('index', { title: 'Autonomous Tank' });
          return;
        }
        console.log('Snapshot downloaded');
        Jimp.read('./public/images/snapshot.jpg', (errRead, image) => {
          if (errRead) {
            console.error('Could not read in downloaded snapshot with error: ' + errRead);
            res.render('index', { title: 'Autonomous Tank' });
            return;
          };
          // var embossKernel =  [[-2, -1,  0],[-1,  1,  1],[0,   1,  2]];
          // var edgeDetectKernel =  [[ 0,  1,  0],[ 1, -4,  1],[ 0,  1,  0]];
          // var edgeEnhanceKernel =  [[ 0,  0,  0],[-1,  1,  0],[ 0,  0,  0]];
          var identityKernel =         [[ 0,   0,  0],  [  0,   1,   0],  [ 0,   0,  0]];
          var sharpenKernel =          [[ 0,  -1,  0],  [ -1,   5,  -1],  [ 0,  -1,  0]];
          var findEdgesKernel =        [[-1,  -1, -1],  [ -1,   8,  -1],  [-1,  -1, -1]];
          var blurKernel =             [[ 0, 0.5,  0],  [0.5,  -1, 0.5],  [ 0, 0.5,  0]];
          var increaseContrastKernel = [[ 0,   0,  0],  [  0,   2,   0],  [ 0,   0,  0]];
          var decreaseContrastKernel = [[ 0,   0,  0],  [  0, 0.5,   0],  [ 0,   0,  0]];
          var preKernel, postKernel;
          switch (req.query.pre) {
            case 'blur':          preKernel = blurKernel;               break;
            case 'sharpen':       preKernel = sharpenKernel;            break;
            case 'inc-contrast':  preKernel = increaseContrastKernel;   break;
            case 'dec-contrast':  preKernel = decreaseContrastKernel;   break;
            default:              preKernel = identityKernel;
          }
          switch (req.query.post) {
            case 'blur':          postKernel = blurKernel;              break;
            case 'sharpen':       postKernel = sharpenKernel;           break;
            case 'inc-contrast':  postKernel = increaseContrastKernel;  break;
            case 'dec-contrast':  postKernel = decreaseContrastKernel;  break;
            default:              postKernel = identityKernel;
          }
          if (req.query.edgeA) {
            findEdgesKernel[0][0] =   findEdgesKernel[0][1] = findEdgesKernel[0][1] =
              findEdgesKernel[1][0] = findEdgesKernel[1][2] =
              findEdgesKernel[2][0] = findEdgesKernel[2][1] = findEdgesKernel[2][2] = req.query.edgeA; //-0.9;  
            findEdgesKernel[1][1] = req.query.edgeB; //7.2;
          }
          console.log('Found: ' + findEdgesKernel[1][1]);
          image.greyscale(                              function(errConvolute, imgGrey) {
            imgGrey.convolute(        preKernel,        function(errConvolute, imgFirst) {
              imgFirst.convolute(     findEdgesKernel,  function(errConvolute, imgSecond) {
                imgSecond.convolute(  postKernel,       function(errConvolute, imgThird) {
                  imgThird
                  imgThird.write('./public/images/find-edges.jpg', function(errWrite) {
                    res.render('index', { title: 'Autonomous Tank' });
                  });
                });  // third
              });    // second
            });      // first
          });        // grey
        });          // Jimp.read()
      });            // download()
    });              // fs.copyFile()
  });                // fs.copyFile()
});                  // router.get()

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
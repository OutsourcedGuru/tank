exports.identity =         [[ 0,   0,  0],  [  0,   1,   0],  [ 0,   0,  0]];
exports.emboss =           [[-2,  -1,  0],  [ -1,   1,   1],  [ 0,   1,  2]];
exports.edgeDetect =       [[ 0,   1,  0],  [  1,  -4,   1],  [ 0,   1,  0]];
exports.edgeEnhance =      [[ 0,   0,  0],  [ -1,   1,   0],  [ 0,   0,  0]];
exports.sharpen =          [[ 0,  -1,  0],  [ -1,   5,  -1],  [ 0,  -1,  0]];
exports.altSharpen =       [[-1,  -1, -1],  [ -1,  12,  -1],  [-1,  -1, -1]];
exports.bold =             [[ 0,   0,  0],  [  0,   1,   1],  [ 0,   0,  0]];
exports.findEdges =        [[-1,  -1, -1],  [ -1,   8,  -1],  [-1,  -1, -1]];
exports.altFindEdges =     [[0, 0, 1, 0, 0], [0, 1, 2, 1, 0], [1, 2, -16, 2, 1], [0, 1, 2, 1, 0], [0, 0, 1, 0, 0]];
exports.mexicanHat =       [[0, 0, 0, -1, -1, -1, 0, 0, 0], [0, -1, -1, -3, -3, -3, -1, -1, 0], [0, -1, -3, -3, -1, -3, -3, -1, 0], [-1, -3, -3, 6, 13, 6, -3, -3, -1], [-1, -3, -1, 13, 24, 13, -1, -3, -1], [-1, -3, -3, 6, 13, 6, -3, -3, -1], [0, -1, -3, -3, -1, -3, -3, -1, 0], [0, -1, -1, -3, -3, -3, -1, -1, 0], [0, 0, 0, -1, -1, -1, 0, 0, 0]];
exports.blur =             [[ 0, 0.5,  0],  [0.5,  -1, 0.5],  [ 0, 0.5,  0]];
exports.increaseContrast = [[ 0,   0,  0],  [  0,   2,   0],  [ 0,   0,  0]];
exports.decreaseContrast = [[ 0,   0,  0],  [  0, 0.5,   0],  [ 0,   0,  0]];


/*
Find Edges
Uses a Sobel edge detector to highlight sharp changes in intensity in the active
image. Two 3x3 convolution kernels are used to generate vertical and horizontal
derivatives. The final image is produced by combining the two derivatives using
the square root of the sum of the squares.
     1  2  1     1  0 -1
     0  0  0     2  0 -2
    -1 -2 -1     1  0 -1

Another Find Edges, "altFindEdges" above
0   0   1   0   0
0   1   2   1   0
1   2 -16   2   1
0   1   2   1   0
0   0   1   0   0

Guassian
| 1   4   6   4   1 |
| 4  16  24  16   4 |
| 6  24  36  24   6 |
| 4  16  24  16   4 |
| 1   4   6   4   1 | / 256

Remove Outliers
Replaces a pixel by the median of the pixels in the surrounding if it deviates
from the median by more than a certain value (the threshold). Useful for correcting
hot pixels or dead pixels of a CCD image.
Radius = 2.0 pixels
Threshold = 50
Which Outliers = Bright/Dark

FFT Bandpass Filter
Filter Small Structures Up to - Determines the amount of smoothing. Objects in the
image smaller than this size are strongly attenuated. Note that these values are
both half the spatial frequencies of the actual cutoff. The cutoff is very soft,
so the bandpass will noticeably attenuate even spatial frequencies in the center
of the bandpass unless the difference of the two values is large (say, more than
a factor of 5 or so).

Smoothing + Edge Detection ("altMexicanHat" as seen above - 9x9 matrix)
 0   0   0  -1  -1  -1   0   0   0
 0  -1  -1  -3  -3  -3  -1  -1   0
 0  -1  -3  -3  -1  -3  -3  -1   0
-1  -3  -3   6  13   6  -3  -3  -1
-1  -3  -1  13  24  13  -1  -3  -1
-1  -3  -3   6  13   6  -3  -3  -1
 0  -1  -3  -3  -1  -3  -3  -1   0
 0  -1  -1  -3  -3  -3  -1  -1   0
 0   0   0  -1  -1  -1   0   0   0

Minimum
This filter does grayscale erosion by replacing each pixel in the image with the
smallest pixel value in that pixel's neighborhood.
*/
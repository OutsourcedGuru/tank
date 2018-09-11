# Technical Details
The following is a bit of a diary involving the design decisions and research that went into this project.

Examples [1](#1)

```
/*
  Software serial multple serial test

 Receives from the hardware serial, sends to software serial.
 Receives from software serial, sends to hardware serial.

 The circuit:
 * RX is digital pin 10 (connect to TX of other device)
 * TX is digital pin 11 (connect to RX of other device)

 Note:
 Not all pins on the Mega and Mega 2560 support change interrupts,
 so only the following can be used for RX:
 10, 11, 12, 13, 50, 51, 52, 53, 62, 63, 64, 65, 66, 67, 68, 69

 Not all pins on the Leonardo and Micro support change interrupts,
 so only the following can be used for RX:
 8, 9, 10, 11, 14 (MISO), 15 (SCK), 16 (MOSI).

 created back in the mists of time
 modified 25 May 2012
 by Tom Igoe
 based on Mikal Hart's example

 This example code is in the public domain.

 */
#include <SoftwareSerial.h>

SoftwareSerial mySerial(10, 11); // RX, TX

void setup() {
  // Open serial communications and wait for port to open:
  Serial.begin(57600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }


  Serial.println("Goodnight moon!");

  // set the data rate for the SoftwareSerial port
  mySerial.begin(4800);
  mySerial.println("Hello, world?");
}

void loop() { // run over and over
  if (mySerial.available()) {
    Serial.write(mySerial.read());
  }
  if (Serial.available()) {
    mySerial.write(Serial.read());
  }
}
```

## SoftWareSerial Library

> "Not all pins on the Mega and Mega 2560 support change interrupts, so only the following can be used for RX: 10, 11, 12, 13, 14, 15, 50, 51, 52, 53, A8 (62), A9 (63), A10 (64), A11 (65), A12 (66), A13 (67), A14 (68), A15 (69)." [2](#2)

This will be the library I'll use on the Arduino side of things.

* SoftwareSerial() [4](#4)
* begin(baudrate) [5](#5)
* listen() [6](#6)
* read() [7](#7)
* parseInt() [8](#8)
* ReadASCIIString example [9](#9)

```
SoftwareSerial mySerial(10,11);

void setup()
{
  mySerial.begin(9600);
}

void loop()
{
  char c = mySerial.read();
}
```

```
#include <SoftwareSerial.h>

#define rxPin 10
#define txPin 11

// set up a new serial port
SoftwareSerial mySerial =  SoftwareSerial(rxPin, txPin);

void setup()  {
  // define pin modes for tx, rx:
  pinMode(rxPin, INPUT);
  pinMode(txPin, OUTPUT);
  // set the data rate for the SoftwareSerial port
  mySerial.begin(9600);
}
```

## Two-Serial Ports at Once on Arduino
```
/*
  Software serial multple serial test

 Receives from the two software serial ports,
 sends to the hardware serial port.

 In order to listen on a software port, you call port.listen().
 When using two software serial ports, you have to switch ports
 by listen()ing on each one in turn. Pick a logical time to switch
 ports, like the end of an expected transmission, or when the
 buffer is empty. This example switches ports when there is nothing
 more to read from a port

 The circuit:
 Two devices which communicate serially are needed.
 * First serial device's TX attached to digital pin 10(RX), RX to pin 11(TX)
 * Second serial device's TX attached to digital pin 8(RX), RX to pin 9(TX)

 Note:
 Not all pins on the Mega and Mega 2560 support change interrupts,
 so only the following can be used for RX:
 10, 11, 12, 13, 50, 51, 52, 53, 62, 63, 64, 65, 66, 67, 68, 69

 Not all pins on the Leonardo support change interrupts,
 so only the following can be used for RX:
 8, 9, 10, 11, 14 (MISO), 15 (SCK), 16 (MOSI).

 created 18 Apr. 2011
 modified 19 March 2016
 by Tom Igoe
 based on Mikal Hart's twoPortRXExample

 This example code is in the public domain.

 */

#include <SoftwareSerial.h>
// software serial #1: RX = digital pin 10, TX = digital pin 11
SoftwareSerial portOne(10, 11);

// software serial #2: RX = digital pin 8, TX = digital pin 9
// on the Mega, use other pins instead, since 8 and 9 don't work on the Mega
SoftwareSerial portTwo(8, 9);

void setup() {
  // Open serial communications and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }


  // Start each software serial port
  portOne.begin(9600);
  portTwo.begin(9600);
}

void loop() {
  // By default, the last intialized port is listening.
  // when you want to listen on a port, explicitly select it:
  portOne.listen();
  Serial.println("Data from port one:");
  // while there is data coming in, read it
  // and send to the hardware serial port:
  while (portOne.available() > 0) {
    char inByte = portOne.read();
    Serial.write(inByte);
  }

  // blank line to separate data from the two ports:
  Serial.println();

  // Now listen on the second port
  portTwo.listen();
  // while there is data coming in, read it
  // and send to the hardware serial port:
  Serial.println("Data from port two:");
  while (portTwo.available() > 0) {
    char inByte = portTwo.read();
    Serial.write(inByte);
  }

  // blank line to separate data from the two ports:
  Serial.println();
}
```
Pins 2 and 4 are separate RX inputs; 3 and 5 are TX outputs. [3](#3)

# Raspberry Pi Zero W Setup
I assume here that the Raspberry Pi Zero W has gone through its initial paces of receiving a hostname, adjusting the timezone/localization settings and expanding the file system. I also assume that mjpg_streamer has been installed and the necessary changes for this to include plugging in the Pi cam.

1. Solder three-pin header to pins 4, 6, 8 (5V, Gnd, BCM 14 Tx)
2. Connect red to 4, black to 6 and blue to 8. On the Arduino end, red to 5V and black to Gnd in the POWER section and blue to 10 on the opposite side
3. `sudo apt-get update`
4. `sudo apt-get install python-pip`
5. `pip install pyserial` # Enough preparation for Phase 1
6. `sudo apt-get install git`
7. `mkdir ~/tmp && cd ~/tmp`
8. `wget https://nodejs.org/dist/v8.11.4/node-v8.11.4-linux-armv6l.tar.xz`
9. `tar -xvf *.xz`
10. `cd node*l`
11. `sudo cp -R * /usr/local/`
12. `node --version`
13. `cd ~/sites && rm -R ~/tmp` # Node.js and npm are now installed
14. `sudo npm install -g express-generator`
15. `express --ejs tank && cd tank && npm install`
16. `DEBUG=tank:* npm start`
17. `npm install --save raspi` # Adding serial support to web interface
18. `npm install --save raspi-serial`

## Lane-recognition transforms

The series of steps to accomplish the goal for this project are as follows: [10](#10)

1. Compute the camera calibration matrix and distortion coefficients.
2. Apply a distortion correction to raw images.
3. Use color transforms, gradients, etc., to create a thresholded binary image.
4. Apply a perspective transform to generate a “bird’s-eye view” of the image.
5. Detect lane pixels and fit to find the lane boundary.
6. Determine the curvature of the lane and vehicle position with respect to center.
7. Warp the detected lane boundaries back onto the original image and display numerical estimation of lane curvature and vehicle position.


## Bibliography

#### <a name="1"></a>1. [Arduino Serial Examples](https://www.arduino.cc/en/Tutorial/SoftwareSerialExample)

#### <a name="2"></a>2. [Arduino SoftwareSerial](https://www.arduino.cc/en/Reference/SoftwareSerial)

#### <a name="3"></a>3. [Arduino Two-Port Receive](https://www.arduino.cc/en/Tutorial/TwoPortReceive)

#### <a name="4"></a>4. [SoftwareSerial constructor](https://www.arduino.cc/en/Reference/SoftwareSerialConstructor)

#### <a name="5"></a>5. [begin(baudrate)](https://www.arduino.cc/en/Reference/SoftwareSerialBegin)

#### <a name="6"></a>6. [listen()](https://www.arduino.cc/en/Reference/SoftwareSerialListen)

#### <a name="7"></a>7. [read()](https://www.arduino.cc/en/Reference/SoftwareSerialRead)

#### <a name="8"></a>8. [parseInt()](https://www.arduino.cc/en/Reference/ParseInt)

#### <a name="9"></a>9. [ReadASCIIString example](https://www.arduino.cc/en/Tutorial/ReadASCIIString)

#### <a name="10"></a>10. [Advanced Land Detection for Autonomous Vehicles](https://towardsdatascience.com/advanced-lane-detection-for-autonomous-vehicles-using-computer-vision-techniques-f229e4245e41)
# tank
An automomously/manually driven tank with Arduino (C) and Raspberry Pi Zero W (Python/Node.js) with additional remote-control Raspberry Pi Zero W

## Overview
This project involves assembly of the tank kit itself, soldering to add the 3-pin header to the Raspberry Pi Zero W circuit board, 3D printing of the housing for the Pi Zero and a reasonable understanding of both C programming in the Arduino software as well as Python and NodeJS (JavaScript) programming on the Raspberry.

The tank's stepper motors are driven by the Arduino + 6612 shield combination. There appears to be plenty of examples to get this going.

The driving logic, however, are on the Raspberry Pi Zero W since it has wi-fi, a full operating system, easy access to a camera and streaming as well as robust platforms such as NodeJS.

A serial link and interface connects the two separate systems which all sit atop the tank itself. Since the communication is one-way, I've decided not to use a logic-level converter from the Raspi's 3.3V to the Arduino's expected 5V; it works as long as the baudrate is throttled at 4800.

### Phase 1
[x] In the first phase of the project, a simple Python script running on the Pi will send commands over the serial interface to the Arduino for steering.

### Phase 2
[x] In the second phase, a NodeJS web interface on the Pi will allow both the webcam stream to be viewed plus to control the tank, presumably from an iPhone.

### Phase 3
[ ] In the third phase, individual frames from the camera will be analyzed to allow a NodeJS program to automamously steer the tank around a course.

## Parts

* [OSEPP Tank Mechanical Kit](https://www.osepp.com/robotic-kits/4-tank-mechanical-kit)
* [OSEPP Mega 2560 R3 Plus](https://www.osepp.com/electronic-modules/microcontroller-boards/101-osepp-mega-2560-r3-plus)
* [OSEPP Motor Shield 6612](https://www.osepp.com/electronic-modules/shields/120-motor-shield-6612)
* [Raspberry Pi Zero W](https://www.adafruit.com/product/3400)
* [Raspberry Pi Camera Board](https://www.adafruit.com/product/3099)
* [Ribbon Cable for Pi Zero](https://www.adafruit.com/product/3157)
* 4GB or larger microSD for the Raspberry Pi Zero W
* M-F 6" connection wiring
* Break-away jumpers (3 pins) for the Raspberry Pi Zero W
* Extra aluminim bolts, standoffs of different sizes

![tank_01___1_-759-800-600-80](https://user-images.githubusercontent.com/15971213/45173613-8ef29d00-b1bd-11e8-8f21-86c4f1f96e1b.jpg)

![meg_03__1_-648-800-600-80](https://user-images.githubusercontent.com/15971213/45173835-27891d00-b1be-11e8-81a1-741d583d0cae.jpg)

![tbshd_01__1_-772-800-600-80](https://user-images.githubusercontent.com/15971213/45173799-0de7d580-b1be-11e8-8c9f-9d1f8dae0a13.jpg)

![raspberry-3400-00](https://user-images.githubusercontent.com/15971213/45173865-3d96dd80-b1be-11e8-8301-411737559a42.jpg)

![camera-3099-04](https://user-images.githubusercontent.com/15971213/45174094-cdd52280-b1be-11e8-9c9c-aa27e4ceeaba.jpg)

![cable-3157-02](https://user-images.githubusercontent.com/15971213/45174056-b4cc7180-b1be-11e8-814f-5597a6b547e1.jpg)

## Schematic
This is a limited version of the schematic in that Fritzing doesn't yet have the OSEPP 6612 Motor Shield board definition. The shield sits on top of the OSEPP Mega 2560 R3 Plus board itself, taking in the 9V DC power supply and providing it back to each of two servo motors which drive the tracks.

![schematic](https://user-images.githubusercontent.com/15971213/45173434-0ecc3780-b1bd-11e8-92f5-89ce5c769fd5.png)

|Description|Version|Author|Last Update|
|:---|:---|:---|:---|
|tank|v1.1.6|OutsourcedGuru|September 20, 2018|

|Donate||Cryptocurrency|
|:-----:|---|:--------:|
| ![eth-receive](https://user-images.githubusercontent.com/15971213/40564950-932d4d10-601f-11e8-90f0-459f8b32f01c.png) || ![btc-receive](https://user-images.githubusercontent.com/15971213/40564971-a2826002-601f-11e8-8d5e-eeb35ab53300.png) |
|Ethereum||Bitcoin|
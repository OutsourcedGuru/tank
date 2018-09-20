#!/usr/bin/python

import time
import serial

# BCM 14, BOARD 8 is the TX pin used on the Raspberry
ser = serial.Serial('/dev/serial0', 4800)

while True:
        ser.write('Hello world!\n')
        print 'Hello world!'
        time.sleep(5.0)


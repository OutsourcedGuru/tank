#!/usr/bin/python

import time
import serial

# BCM 14, BOARD 8 is the TX pin used on the Raspberry
ser = serial.Serial('/dev/serial0', 4800)

while True:
        ser.write('L50 R50\n')
        print 'L50 R50'
        time.sleep(5.0)

        ser.write('L0 R0\n')
        print 'L0 R0'
        time.sleep(5.0)

        ser.write('L100 R-100\n')
        print 'L100 R-100'
        time.sleep(5.0)

        ser.write('L0 R0\n')
        print 'L0 R0'
        time.sleep(5.0)

        ser.write('L-100 R100\n')
        print 'L-100 R100'
        time.sleep(5.0)

        ser.write('L-50 R50\n')
        print 'L-50 R50'
        time.sleep(5.0)

        ser.write('L0 R0\n')
        print 'L0 R0'
        time.sleep(10.0)



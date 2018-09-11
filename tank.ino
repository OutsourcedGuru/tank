/*
 * OBJECT AVOIDANCE WITH SERVO
 * 
 * Robot will avoid objects in front.
 * Ultrasonic sensor scans for the best route to take
 * Robot can't detect objects at it's side, best to install 2 IR Detectors
 *
 * Best used on OSEPP Mechanical Kits.
 * TANK-01
 * TRITANK-01
 *
 * created 08 Nov 2016
 * by Sui Wei
 *
 */
 
#include "sensorsDRV.h"
#include <avr/wdt.h>
#include "TBMotor.h"
#include <Servo.h>
#include <SoftwareSerial.h>

//OseppTBMotor Motor1(12, 11);
//OseppTBMotor Motor2(8, 3);
OseppTBMotor Motor3(7, 6);
OseppTBMotor Motor4(4, 5);
#define leftMotor Motor3
#define rightMotor Motor4
int leftSpeed = 0;
int rightSpeed = 0;
SoftwareSerial portConsole(0, 1);
SoftwareSerial portRaspi(52, 14);


void setup()
{
  //Setup a watchdog
  //When the battery voltage is insufficient / program unexpected
  //Watchdog reset chip
  wdt_enable(WDTO_4S);
  // Setup both serial connections
  portConsole.begin(115200);
  portRaspi.begin(4800);
  portConsole.println("Starting serial...");
}

void loop()
{
//  const float threshold = 300;
  char strChar[2];
  strChar[0] = strChar[1] = '\0';

  //If in 4 seconds,The program is not coming back here.
  //Chip will reset
  wdt_reset();

  char *pstrCommand = "";
  int nLeft = 0, nRight = 0;
  while (portRaspi.available() > 0) {
    char inByte = portRaspi.read();
    if (inByte == '\n') {
      portConsole.print("\n");
      char strLeft[5] = "", strRight[5] = "";
      if (pstrCommand[0] == 'L') {
        char *pSpace = strstr(pstrCommand, " ");
        if (pSpace) {
          int nSpaceOffset = pSpace - pstrCommand;
          int nLengthLeftNumber = pSpace - pstrCommand - 1;
          int nLengthRightNumber = strlen(pstrCommand) - nLengthLeftNumber - 3;
          // Copy the left number
          strncpy(strLeft, pstrCommand + 1, nLengthLeftNumber);
          strLeft[nLengthLeftNumber] = '\0';
          // Copy the right number
          strncpy(strRight, pSpace + 2, nLengthRightNumber);
          strRight[nLengthRightNumber] = '\0';
          nLeft = atoi(strLeft);
          nRight = atoi(strRight);
          // Now set the motors
          leftSpeed = nLeft;
          rightSpeed = nRight;
          setMotors();
        }
      }
      // Empty out the line buffer
      pstrCommand[0] = '\0';
    } else {
      // Add one to the line buffer
      strChar[0] = inByte;
      pstrCommand = strcat(pstrCommand, strChar);
    }
  }
}

void setMotors()
{
  if (leftSpeed > 255)  leftSpeed = 255;  else if (leftSpeed < -255)  leftSpeed = -255;
  if (rightSpeed > 255) rightSpeed = 255; else if (rightSpeed < -255) rightSpeed = -255;
  leftMotor.SetSpeed(leftSpeed);
  rightMotor.SetSpeed(rightSpeed);
}


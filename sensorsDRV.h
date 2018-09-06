#ifndef _SENSORSDRV_H_
#define _SENSORSDRV_H_


#include <stdint.h>

class Ultrasonic
{
  public:
    Ultrasonic(uint8_t Trig_Pin, uint8_t Echo_Pin);
    float Detect();
    float Distance;
  private:
    uint8_t _Trig_Pin, _Echo_Pin;
};

class IRDetector
{
  public:
     IRDetector(uint8_t Pin);
     bool Detect();
     bool Active;
  private:
    uint8_t _Pin;
};
#endif

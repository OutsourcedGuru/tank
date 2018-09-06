#include "SensorsDRV.h"
#include <Arduino.h>

Ultrasonic::Ultrasonic(uint8_t Trig_Pin, uint8_t Echo_Pin)
{
  _Trig_Pin = Trig_Pin;
  _Echo_Pin = Echo_Pin;
  Distance = 0;
  pinMode(_Echo_Pin, INPUT);
  pinMode(_Trig_Pin, OUTPUT);
}

float Ultrasonic::Detect()
{
  digitalWrite(_Trig_Pin, LOW); // 保持超声波控制接口低电平2us
  delayMicroseconds(2);
  digitalWrite(_Trig_Pin, HIGH); // 保持超声波控制接口高电平10us
  delayMicroseconds(10);
  digitalWrite(_Trig_Pin, LOW);    // 超声波控制接口转低电平以触发测距过程
  Distance = pulseIn(_Echo_Pin, HIGH, 3000) / 5.8;
  if (Distance == 0)Distance = 5000;
  return Distance;
}




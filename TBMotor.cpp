#include <Arduino.h>
#include "TBMotor.h"

OseppTBMotor::OseppTBMotor(uint8_t dir_pin, uint8_t pwm_pin)
{
  _dir_pin=dir_pin;
  _pwm_pin=pwm_pin;
  pinMode(_dir_pin,OUTPUT);
  digitalWrite(_pwm_pin,LOW);
}
void OseppTBMotor::forward(uint8_t speed)
{
  digitalWrite(_dir_pin,HIGH);
  analogWrite( _pwm_pin,speed);
}
void OseppTBMotor::backward(uint8_t speed)
{
  digitalWrite(_dir_pin,LOW);
  analogWrite( _pwm_pin,speed);
}
void OseppTBMotor::SetSpeed(int speed)
{
  if(speed<0)
  {
    speed=-speed;
    digitalWrite(_dir_pin,LOW);
  }else{
    digitalWrite(_dir_pin,HIGH);
  }
  analogWrite( _pwm_pin,speed);
}


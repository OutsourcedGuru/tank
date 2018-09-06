class OseppTBMotor
{
  public:
    OseppTBMotor(uint8_t dir_pin, uint8_t pwm_pin);
    void forward(uint8_t speed);
    void backward(uint8_t speed);
    void SetSpeed(int speed);
  private:
    uint8_t _dir_pin, _pwm_pin;
};

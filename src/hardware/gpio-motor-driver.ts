class GPIOMotorDriver implements IMotorDriver {

    constructor(
        private leftPins: DigitalPin[],
        private rightPins: DigitalPin[]
    ) {}

    init(): void {}

    setSpeed(left: number, right: number): void {
        if (this.leftPins.length === 0 || this.rightPins.length === 0)
            control.fail("Pines de motores no configurados.");
        this._setMotor(this.leftPins, left);
        this._setMotor(this.rightPins, -right);
    }

    stop(): void {
        this.setSpeed(0, 0);
    }

    private _setMotor(motorPins: DigitalPin[], speed: number): void {
        const value = Math.min(MAX_MOTOR_SPEED, Math.max(-MAX_MOTOR_SPEED, speed));
        const pwm = Math.floor(Math.abs(value) * 1023 / 100);

        if (value > 0) {
            pins.digitalWritePin(motorPins[1], 0);
            pins.analogWritePin(motorPins[0], pwm);

        } else if (value < 0) {
            pins.digitalWritePin(motorPins[0], 0);
            pins.analogWritePin(motorPins[1], pwm);

        } else {
            pins.digitalWritePin(motorPins[0], 0);
            pins.digitalWritePin(motorPins[1], 0);
        }
    }
}

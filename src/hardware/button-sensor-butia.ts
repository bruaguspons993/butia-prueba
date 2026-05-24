class ButtonSensor implements IButtonSensor {
    private _pin: DigitalPin;

    constructor(pin: DigitalPin) {
        this._pin = pin;
    }

    getPin(): number { return this._pin; }
    init(): void {}
    read(): number { return pins.digitalReadPin(this._pin); }
}

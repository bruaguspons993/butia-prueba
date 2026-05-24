class DistanceSensor implements IDistanceSensor {
    private _pinTrigger: DigitalPin|AnalogPin;
    constructor(pinTrigger: DigitalPin|AnalogPin) {
        this._pinTrigger = pinTrigger;
    }

    getPin(): number {
        return this._pinTrigger;
    }
    init(): void {}
    read(): number {
        const adc_value = pins.analogReadPin(this._pinTrigger as number as AnalogPin);
        return 9462 / (adc_value - 16);
    }
}

// PXT does not support `abstract class` — this DI base class is the approved substitute.

namespace Butia {
    export class RobotBase implements IRobot {
        // --- Fields ---
        private _motors: IMotorDriver;
        private _lights: {pin:AnalogPin | DigitalPin, sensor: ILightSensor}[];
        private _grays: {pin:AnalogPin | DigitalPin, sensor: IGraySensor}[];
        private _distances: {pin:AnalogPin | DigitalPin, sensor: IDistanceSensor}[];
        private _buttons: {pin:AnalogPin | DigitalPin, sensor: IButtonSensor}[];
        private _connectorConfig: IConnectorPin[];
        private _motorLeft: number;
        private _motorRight: number;
        private _pinUsage: { pin: AnalogPin | DigitalPin; type: string }[];
        private _eventMonitor: EventMonitor;
        // --- Constructor ---
        constructor(
            motors: IMotorDriver,
            connectorConfig: IConnectorPin[]
        ) {
            this._motors = motors;
            this._connectorConfig = connectorConfig;
            this._lights = [];
            this._grays = [];
            this._distances = [];
            this._buttons = [];
            this._motorLeft = 0;
            this._motorRight = 0;
            this._pinUsage = [];
            this._eventMonitor = this._newEventMonitor();
        }

        // Overridable factory — tests use this to inject a monitor that
        // doesn't auto-start the background fiber.
        protected _newEventMonitor(): EventMonitor { return new EventMonitor(); }

        // --- Private helpers ---
        private _resolvePin(connector: IConnector): AnalogPin|DigitalPin {
            for (const cp of this._connectorConfig) {
                if (cp.connector.name === connector.name) return cp.pin;
            }
            control.fail("Conector " + connector.name + " no encontrado.");
            return 0 as AnalogPin;
        }

        private _claimPin(pin: AnalogPin | DigitalPin, type: string): void {
            let valid = false;
            for (const cp of this._connectorConfig) {
                if (cp.pin === pin) {
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                control.fail("Pin " + pin + " no pertenece a ningún conector configurado.");
            }
            for (const entry of this._pinUsage) {
                if (entry.pin === pin) {
                    if (entry.type !== type) {
                        control.fail("Pin " + pin + " ya está en uso como " + entry.type);
                    }
                    return;
                }
            }
            this._pinUsage.push({ pin, type });
        }

        // --- Sensor factories (overridable for testing) ---
        protected _newLightSensor(pin: AnalogPin | DigitalPin): ILightSensor { return new LightSensor(pin); }
        protected _newGraySensor(pin: AnalogPin | DigitalPin): IGraySensor { return new GraySensor(pin); }
        protected _newDistanceSensor(pin: AnalogPin | DigitalPin): IDistanceSensor { return new DistanceSensor(pin); }
        protected _newButtonSensor(pin: AnalogPin | DigitalPin): IButtonSensor { return new ButtonSensor(pin as DigitalPin); }

        private _getLightSensor(pin: AnalogPin | DigitalPin): ILightSensor {
            for (const entry of this._lights) {
                if (entry.pin === pin) return entry.sensor;
            }
            this._claimPin(pin, "light");
            const sensor = this._newLightSensor(pin);
            this._lights.push({ pin, sensor });
            return sensor;
        }

        private _getGraySensor(pin: AnalogPin | DigitalPin): IGraySensor {
            for (const entry of this._grays) {
                if (entry.pin === pin) return entry.sensor;
            }
            this._claimPin(pin, "gray");
            const sensor = this._newGraySensor(pin);
            this._grays.push({ pin, sensor });
            return sensor;
        }

        private _getDistanceSensor(pin: AnalogPin | DigitalPin): IDistanceSensor {
            for (const entry of this._distances) {
                if (entry.pin === pin) return entry.sensor;
            }
            this._claimPin(pin, "distance");
            const sensor = this._newDistanceSensor(pin);
            this._distances.push({ pin, sensor });
            return sensor;
        }

        private _getButtonSensor(pin: AnalogPin | DigitalPin): IButtonSensor {
            for (const entry of this._buttons) {
                if (entry.pin === pin) return entry.sensor;
            }
            this._claimPin(pin, "button");
            const sensor = this._newButtonSensor(pin);
            this._buttons.push({ pin, sensor });
            return sensor;
        }

        private _setMotorSpeed(left: number, right: number): void {
            this._motorLeft = left;
            this._motorRight = right;
            this._motors.setSpeed(left, right);
        }

        // --- Movement ---
        moveForward(speed: number, duration?: number): void {
            this._setMotorSpeed(speed, speed);
            if (duration) {
                basic.pause(duration);
                this._setMotorSpeed(0, 0);
            }
        }

        moveBackward(speed: number = 70, duration?: number): void {
            this._setMotorSpeed(-speed, -speed);
            if (duration !== undefined) {
                basic.pause(duration);
                this._setMotorSpeed(0, 0);
            }
        }

        turn(direction: TurnDirection, speed: number = 60, duration?: number): void {
            if (direction === TurnDirection.Left) {
                this._setMotorSpeed(-speed, speed);
            } else {
                this._setMotorSpeed(speed, -speed);
            }
            if (duration !== undefined) {
                basic.pause(duration);
                this._setMotorSpeed(0, 0);
            }
        }

        motorTank(left: number, right: number): void {
            this._setMotorSpeed(left, right);
        }

        motorStop(): void {
            this._setMotorSpeed(0, 0);
        }

        // --- Sensors ---
        readDistanceSensor(connector: IConnector): number {
            const s = this._getDistanceSensor(this._resolvePin(connector));
            return s.read();
        }

        readLightSensor(connector: IConnector): number {
            const s = this._getLightSensor(this._resolvePin(connector));
            return s.read();
        }

        readGraySensor(connector: IConnector): number {
            const s = this._getGraySensor(this._resolvePin(connector));
            return s.read();
        }

        readButton(connector: IConnector): boolean {
            const s = this._getButtonSensor(this._resolvePin(connector));
            return s.read() === 1;
        }

        // --- Events ---
        
        onDistance(connector: IConnector, op: Comparison, threshold: number, handler: () => void): void {
            const pin = this._resolvePin(connector);
            const sensor = this._getDistanceSensor(pin);
            const subId = computeSubId(SENSOR_TYPE_DISTANCE, pin as number, comparisonToDir(op));
            const monitor: IMonitor = {
                subId: subId,
                evaluate: () => {
                    const d = sensor.read();
                    if (d <= 0) return false;
                    return evalComparison(op, d, threshold);
                },
                lastTriggered: false
            };
            control.onEvent(BUTIA_EVENT_ID, subId, handler);
            this._eventMonitor.register(monitor);
        }

        onLight(connector: IConnector, op: Comparison, threshold: number, handler: () => void): void {
            const pin = this._resolvePin(connector);
            const sensor = this._getLightSensor(pin);
            const subId = computeSubId(SENSOR_TYPE_LIGHT, pin as number, comparisonToDir(op));
            const monitor: IMonitor = {
                subId: subId,
                evaluate: () => evalComparison(op, sensor.read(), threshold),
                lastTriggered: false
            };
            control.onEvent(BUTIA_EVENT_ID, subId, handler);
            this._eventMonitor.register(monitor);
        }

        onGray(connector: IConnector, op: Comparison, threshold: number, handler: () => void): void {
            const pin = this._resolvePin(connector);
            const sensor = this._getGraySensor(pin);
            const subId = computeSubId(SENSOR_TYPE_GRAY, pin as number, comparisonToDir(op));
            const monitor: IMonitor = {
                subId: subId,
                evaluate: () => evalComparison(op, sensor.read(), threshold),
                lastTriggered: false
            };
            control.onEvent(BUTIA_EVENT_ID, subId, handler);
            this._eventMonitor.register(monitor);
        }

        onConnectorButton(connector: IConnector, state: ButtonState, handler: () => void): void {
            const pin = this._resolvePin(connector);
            const sensor = this._getButtonSensor(pin);
            const dir = state === ButtonState.Pressed ? DIR_GREATER_OR_PRESSED : DIR_LESS_OR_RELEASED;
            const subId = computeSubId(SENSOR_TYPE_BUTTON, pin as number, dir);
            const target = state === ButtonState.Pressed ? 1 : 0;
            const monitor: IMonitor = {
                subId: subId,
                evaluate: () => sensor.read() === target,
                lastTriggered: false
            };
            control.onEvent(BUTIA_EVENT_ID, subId, handler);
            this._eventMonitor.register(monitor);
        }

        // Exposed for tests — drives one polling cycle without sleeping.
        // Returns the subIds that fired this cycle.
        _stepEventMonitor(): number[] {
            return this._eventMonitor.pollOnce();
        }

        // --- Getters ---
        public motorLeft(): number { return this._motorLeft; }
        public motorRight(): number { return this._motorRight; }

        // --- Overridable stub ---
        start(): void {}
    }
}

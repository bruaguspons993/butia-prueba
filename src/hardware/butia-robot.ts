// ButiaRobot wires the Butia v4 hardware components.
// Pin assignments are placeholders — pending Butia v4 schematic confirmation.

namespace Butia {
    //% fixedInstances
    export class ButiaV4Connector extends Connector {
        constructor(name: string) { super(name); }
    }

    //% fixedInstance whenUsed block="J1"
    export const J1 = new ButiaV4Connector("J1");
    //% fixedInstance whenUsed block="J2"
    export const J2 = new ButiaV4Connector("J2");
    //% fixedInstance whenUsed block="J3"
    export const J3 = new ButiaV4Connector("J3");
    //% fixedInstance whenUsed block="J4"
    export const J4 = new ButiaV4Connector("J4");
    //% fixedInstance whenUsed block="J5"
    export const J5 = new ButiaV4Connector("J5");

    class ButiaRobot extends RobotBase {
        constructor() {
            super(
                new GPIOMotorDriver(
                    [DigitalPin.P13, DigitalPin.P14],
                    [DigitalPin.P15, DigitalPin.P16]
                ),
                [
                    new ConnectorPin(J1, AnalogPin.P1),
                    new ConnectorPin(J2, AnalogPin.P2),
                    new ConnectorPin(J3, AnalogPin.P3),
                    new ConnectorPin(J4, AnalogPin.P4),
                    new ConnectorPin(J5, AnalogPin.P10),
                ]);
        }
        start(): void {
            super.start();
        }
    }

    //% fixedInstance block="Butia v4"
    export const Butia4_1_0 = new RobotDriver(new ButiaRobot());
}

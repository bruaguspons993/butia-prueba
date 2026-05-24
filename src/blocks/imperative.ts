//% color="#84c324" icon="\uf410"
//% groups="['Sensores', 'Motores']"
namespace Butia {

    //% blockId="butia_imp_move_forward"
    //% block="Avanzar a velocidad %speed || durante %duration segundos"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% duration.min=0
    //% duration.defl=2
    //% weight=100
    //% group="Motores"
    export function moveForward(speed: number, duration?: number): void {
        const ms = duration ? duration * 1000 : undefined;
        Butia.RobotDriver.getCurrentRobot().moveForward(speed, ms);
    }

    //% blockId="butia_imp_move_backward"
    //% block="Retroceder a velocidad %speed || durante %duration segundos"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% duration.min=0
    //% duration.defl=2
    //% weight=95
    //% group="Motores"
    export function moveBackward(speed: number, duration?: number): void {
        const ms = duration ? duration * 1000 : undefined;
        Butia.RobotDriver.getCurrentRobot().moveBackward(speed, ms);
    }

    //% blockId="butia_imp_turn"
    //% block="Girar hacia %direction a velocidad %speed || durante %duration segundos"
    //% speed.min=0 speed.max=100 speed.defl=40
    //% duration.min=0
    //% duration.defl=2
    //% weight=90
    //% group="Motores"
    export function turn(direction: TurnDirection, speed: number, duration?: number): void {
        const ms = duration ? duration * 1000 : undefined;
        Butia.RobotDriver.getCurrentRobot().turn(direction, speed, ms);
    }

    //% blockId="butia_imp_motor_tank"
    //% block="Motor Izquierdo %left Derecho %right"
    //% left.min=-100 left.max=100 left.defl=70
    //% right.min=-100 right.max=100 right.defl=70
    //% weight=85
    //% group="Motores"
    export function motorTank(left: number, right: number): void {
        Butia.RobotDriver.getCurrentRobot().motorTank(left, right);
    }

    //% blockId="butia_imp_stop"
    //% block="Apagar Motor"
    //% weight=80
    //% group="Motores"
    export function motorStop(): void {
        Butia.RobotDriver.getCurrentRobot().motorStop();
    }

    //% blockId="butia_imp_read_gray"
    //% block="Sensor de grises en %connector"
    //% weight=70
    //% group="Sensores"
    export function readGraySensor(connector: Butia.Connector): number {
        return Butia.RobotDriver.getCurrentRobot().readGraySensor(connector);
    }

    //% blockId="butia_imp_read_light"
    //% block="Sensor de luz en %connector"
    //% weight=69
    //% group="Sensores"
    export function readLightSensor(connector: Butia.Connector): number {
        return Butia.RobotDriver.getCurrentRobot().readLightSensor(connector);
    }

    //% blockId="butia_imp_distance"
    //% block="Sensor de Distancia en %connector"
    //% weight=69
    //% group="Sensores"
    export function obstacleDistance(connector: Butia.Connector): number {
        return Butia.RobotDriver.getCurrentRobot().readDistanceSensor(connector);
    }

    //% blockId="butia_imp_read_button"
    //% block="Botón en %connector presionado"
    //% weight=68
    //% group="Sensores"
    export function readButton(connector: Butia.Connector): boolean {
        return Butia.RobotDriver.getCurrentRobot().readButton(connector);
    }
    //% blockId="butia_evt_distance"
    //% block="Cuando el sensor de distancia en %connector sea %op %threshold cm"
    //% threshold.defl=20 threshold.min=1 threshold.max=100
    //% weight=65
    //% advanced=true
    export function onDistance(
        connector: Butia.Connector,
        op: Comparison,
        threshold: number,
        handler: () => void
    ): void {
        Butia.RobotDriver.getCurrentRobot().onDistance(connector, op, threshold, handler);
    }

    //% blockId="butia_evt_light"
    //% block="Cuando el sensor de luz en %connector sea %op %threshold"
    //% threshold.defl=20 threshold.min=1 threshold.max=100
    //% weight=60
    //% advanced=true
    export function onLight(
        connector: Butia.Connector,
        op: Comparison,
        threshold: number,
        handler: () => void
    ): void {
        Butia.RobotDriver.getCurrentRobot().onLight(connector, op, threshold, handler);
    }

    //% blockId="butia_evt_gray"
    //% block="Cuando el sensor de grises en %connector sea %op %threshold"
    //% threshold.defl=20 threshold.min=1 threshold.max=100
    //% weight=55
    //% advanced=true
    export function onGray(
        connector: Butia.Connector,
        op: Comparison,
        threshold: number,
        handler: () => void
    ): void {
        Butia.RobotDriver.getCurrentRobot().onGray(connector, op, threshold, handler);
    }

    //% blockId="butia_evt_button"
    //% block="Cuando se %state el botón en %connector"
    //% weight=70
    //% advanced=true
    export function onButton(
        state: ButtonState,
        connector: Butia.Connector,
        handler: () => void
    ): void {
        Butia.RobotDriver.getCurrentRobot().onConnectorButton(connector, state, handler);
    }
}

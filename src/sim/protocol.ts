namespace Butia {
    export const BUTIA_SIM_CHANNEL = "butia";

    export const enum SimSensorType {
        None = 0,
        Gray = 1,
        Light = 2,
        Distance = 3,
    }

    export interface SimConnectorConfig {
        name: string
        sensorType: SimSensorType
    }

    export interface SimConnectorReading {
        name: string
        value: number
    }

    export interface SimStateMessage {
        type: string
        motorLeft: number
        motorRight: number
        connectors: SimConnectorConfig[]
    }

    export interface SimSensorsMessage {
        type: string
        connectors: SimConnectorReading[]
    }
}

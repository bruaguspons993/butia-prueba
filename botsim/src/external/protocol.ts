export const BUTIA_CHANNEL = "butia"

export const enum SensorType {
    None = 0,
    Gray = 1,
    Light = 2,
    Distance = 3,
}

export interface ConnectorConfig {
    name: string
    sensorType: SensorType
}

export interface ConnectorReading {
    name: string
    value: number
}

export interface ButiaStateMessage {
    type: "state"
    motorLeft: number
    motorRight: number
    connectors: ConnectorConfig[]
}

export interface ButiaSensorsMessage {
    type: "sensors"
    connectors: ConnectorReading[]
}

export type ButiaMessage = ButiaStateMessage | ButiaSensorsMessage

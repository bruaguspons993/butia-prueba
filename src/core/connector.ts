namespace Butia {
    //% fixedInstances
    export class Connector implements IConnector {
        constructor(public readonly name: string) {}
    }

    export class ConnectorPin implements IConnectorPin {
        constructor(
            public readonly connector: IConnector,
            public readonly pin: AnalogPin
        ) {}
    }
}

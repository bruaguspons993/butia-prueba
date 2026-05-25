import { Simulation } from ".."
import { BotSpec, LEDSlotName, WheelSlotName } from "../../bots/specs"
import { ConnectorSpec } from "../../bots/specs"
import { ConnectorConfig, ConnectorReading, SensorType } from "../../external/protocol"
import { Chassis } from "./chassis"
import { Wheel } from "./wheel"
import { LED } from "./led"
import { ConnectorSensor } from "./connectorSensor"
import { makeBallastSpec } from "./ballast"
import {
    EntityShapeSpec,
    EntitySpec,
    defaultDynamicPhysics,
    defaultEntity,
} from "../specs"
import { Entity } from "../entity"
import { Vec2Like } from "../../types/vec2"
import { SpawnSpec } from "../../maps/specs"
import { addShapeSpecToBody } from "../physics"
import { RenderShape, createGraphics } from "../renderer"
import { nextId } from "../../util"

/**
 * The Bot class is a controller for a robot in the simulation. It contains
 * references to the Entity objects that make up the robot, and provides
 * methods for controlling the robot's motors and reading its sensors.
 */
export class Bot {
    public entity: Entity
    public chassis: Chassis
    public wheels = new Map<WheelSlotName, Wheel>()
    public connectors = new Map<string, ConnectorSensor>()
    public leds = new Map<LEDSlotName, LED>()
    public paused = false

    public get pos(): Vec2Like {
        return this.entity.physicsObj.pos
    }
    public get angle(): number {
        return this.entity.physicsObj.angle
    }
    public get forward(): Vec2Like {
        return this.entity.physicsObj.forward
    }
    public get held(): boolean {
        const heldBody = this.entity.sim.physics.mouseJoint?.getBodyB()
        return heldBody === this.entity.physicsObj.body
    }

    constructor(
        public sim: Simulation,
        spawn: SpawnSpec,
        public spec: BotSpec
    ) {
        const chassisShape = Chassis.makeShapeSpec(spec)
        const wheelShapes = Wheel.makeShapeSpecs(spec)
        const ballastShape = makeBallastSpec(spec)

        spec.connectors?.forEach((connectorSpec: ConnectorSpec) => {
            const sensor = new ConnectorSensor(this, connectorSpec)
            this.connectors.set(connectorSpec.name, sensor)
        })

        const shapes: EntityShapeSpec[] = [chassisShape, ...wheelShapes]
        if (ballastShape) shapes.push(ballastShape)

        const entitySpec: EntitySpec = {
            ...defaultEntity(),
            pos: { ...spawn.pos },
            angle: spawn.angle,
            physics: {
                ...defaultDynamicPhysics(),
                // hand-tuned values
                linearDamping: 10,
                angularDamping: 10,
            },
            shapes,
        }

        this.entity = sim.createEntity(entitySpec)

        this.chassis = new Chassis(this, spec.chassis)
        spec.wheels.forEach((wheelSpec) =>
            this.wheels.set(wheelSpec.name, new Wheel(this, wheelSpec))
        )
        spec.leds?.forEach((ledSpec) =>
            this.leds.set(ledSpec.name, new LED(this, ledSpec))
        )
    }

    public destroy() {
        this.chassis.destroy()
        this.wheels.forEach((wheel) => wheel.destroy())
        this.connectors.forEach((sensor) => sensor.destroy())
        this.leds.forEach((led) => led.destroy())
    }

    public update(dtSecs: number) {
        if (this.paused) return
        this.chassis.update(dtSecs)
        this.wheels.forEach((wheel) => wheel.update(dtSecs))
        this.connectors.forEach((sensor) => sensor.update(dtSecs))
        this.leds.forEach((led) => led.update(dtSecs))
    }

    /**
     * Configure connector types from a state message.
     * ConnectorSensor.setType() is frozen-once, so subsequent calls for the
     * same connector are ignored. After setType(), newly built shape specs are
     * registered with the entity's physics body and render object.
     */
    public setConnectorTypes(configs: ConnectorConfig[]): void {
        for (const config of configs) {
            const connector = this.connectors.get(config.name)
            if (!connector) continue
            const prevCount = connector.shapeSpecs.length
            connector.setType(config.sensorType)
            const newSpecs = connector.shapeSpecs
            if (newSpecs.length === prevCount) continue
            // Register newly built shape specs with the entity
            for (const spec of newSpecs) {
                addShapeSpecToBody(this.entity.physicsObj.body, spec)
                const label = spec.label ?? "shape." + nextId()
                const gfx = createGraphics[spec.type][spec.brush.type](
                    spec,
                    spec.brush
                )
                this.entity.renderObj.addShape(label, new RenderShape(spec, gfx))
            }
        }
    }

    public readConnectors(): ConnectorReading[] {
        const result: ConnectorReading[] = []
        for (const [name, sensor] of this.connectors) {
            result.push({ name, value: sensor.getValue() })
        }
        return result
    }

    private setWheelSpeed(name: WheelSlotName, speed: number) {
        const wheel = this.wheels.get(name)
        if (!wheel) return
        wheel.setSpeed(speed)
    }

    public setMotors(left: number, right: number) {
        if (this.held) return
        this.setWheelSpeed("left", left)
        this.setWheelSpeed("right", right)
    }

    public motorStop() {
        this.setWheelSpeed("left", 0)
        this.setWheelSpeed("right", 0)
    }

    public setColor(name: LEDSlotName, color: number) {
        this.chassis.setColor(color)
    }
}

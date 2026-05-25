import { Bot } from "."
import { SensorType } from "../../external/protocol"
import { ConnectorSpec } from "../../bots/specs"
import { Vec2, Vec2Like } from "../../types/vec2"
import { LineSegment } from "../../types/line"
import { nextId, toRadians } from "../../util"
import {
    EntityShapeSpec,
    defaultCircleShape,
    defaultColorBrush,
    defaultEntityShape,
    defaultPolygonShape,
    defaultShaderBrush,
    defaultShapePhysics,
} from "../specs"
import {
    appoximateArc,
    pointInPolygon,
    rgbToFloatArray,
    testOverlap,
    toRenderScale,
} from "../util"
import Planck from "planck-js"
import { RENDER_SCALE } from "../../constants"
import {
    BasicVertexShader,
    CommonFragmentShaderGlobals,
    addShaderProgram,
} from "../renderer"

// Distance sensor cone geometry (cm)
const SENSOR_WIDTH = 4
const SENSOR_HALF_WIDTH = SENSOR_WIDTH / 2
const SENSOR_MAX_RANGE = 100
const SENSOR_BEAM_ANGLE = 30

const waveColor = { r: 0x68, g: 0xae, b: 0xd4 }
const pingColor = { r: 0xff, g: 0x3f, b: 0x3f }
const pingRadius = 3

addShaderProgram(
    "connector_sonar_wave",
    BasicVertexShader,
    CommonFragmentShaderGlobals +
        `
    uniform vec3 uColor;
    uniform float uMaxRange;
    uniform float uBeamAngle;

    float dist(vec2 p0, vec2 p1) {
        return sqrt(pow(p1.x - p0.x, 2.) + pow(p1.y - p0.y, 2.));
    }
    float angle(vec2 p0, vec2 p1) {
        return atan(p1.y - p0.y, p1.x - p0.x) + 1.57;
    }
    void main() {
        vec2 uv = vUvs;
        uv = vec2(uv.x * uAspectRatio, uv.y);
        vec2 ofs = vec2(0.265, 1.1);
        float maxRange = uMaxRange + ofs.y;
        float maxAngle = uBeamAngle / 2.;
        float waveSpeed = 5.;
        float waveCount = 22.;
        float d = dist(ofs, uv);
        float c = mod(uTime * waveSpeed - d * waveCount, 1.);
        c = 1. - c;
        c = c * c;
        c = .2 + c * .66;
        float alpha = c * .75;
        float linFade = 1. - smoothstep(0., 1., d - 0.33);
        float angFade = 1. - smoothstep(0., 1., -0.5 + abs(angle(ofs, uv)) / maxAngle);
        alpha *= linFade * angFade;
        gl_FragColor = vec4(uColor * alpha, alpha);
    }`
)

addShaderProgram(
    "connector_sonar_ping",
    BasicVertexShader,
    CommonFragmentShaderGlobals +
        `
    uniform vec3 uColor;

    float dist(vec2 p0, vec2 p1) {
        return sqrt(pow(p1.x - p0.x, 2.) + pow(p1.y - p0.y, 2.));
    }
    void main() {
        vec2 uv = vUvs;
        uv = vec2(uv.x * uAspectRatio, uv.y);
        float innerMargin = 0.1;
        float outerMargin = 0.05;
        float pingDuration = 1.;
        float pingSpeed = 0.5;
        float r = dist(uv, vec2(0.5, 0.5));
        float time = mod(uTime, pingDuration) * pingSpeed;
        float alpha = smoothstep(time - innerMargin, time, r) * smoothstep(time + outerMargin, time, r);
        float fade = smoothstep(0.5, 0., r);
        vec4 color = vec4(uColor * alpha * fade, alpha * fade);
        gl_FragColor = color;
    }`
)

/**
 * ConnectorSensor models a configurable port (J1–J5) on the Butia robot.
 *
 * Type is frozen on the first non-None call to setType() — subsequent calls
 * are silently ignored so the physics fixtures are only created once.
 *
 * Modes:
 *   Gray / Light → contact-based (same as LineSensor): detects "follow-line"
 *                  fixtures. Value: 0 (no contact) or 100 (contact).
 *   Distance     → raycast-based (same as RangeSensor): detects "obstacle"
 *                  fixtures. Value: distance in cm, max SENSOR_MAX_RANGE.
 */
export class ConnectorSensor {
    sensorId: string

    // Accumulated shape specs added to the entity
    private _shapeSpecs: EntityShapeSpec[] = []

    // Gray/Light mode shapes
    private _onSpec?: EntityShapeSpec
    private _offSpec?: EntityShapeSpec
    private _contactSpec?: EntityShapeSpec

    // Distance mode shapes
    private _coneSpec?: EntityShapeSpec
    private _visualSpec?: EntityShapeSpec
    private _targetSpec?: EntityShapeSpec
    private _sensorVerts?: Vec2Like[]
    private _sensorEdges?: LineSegment[]

    private _type: SensorType = SensorType.None
    // Once frozen, the type and its fixtures are immutable.
    private _frozen: boolean = false
    private _value: number = 0

    public get shapeSpecs(): EntityShapeSpec[] {
        return this._shapeSpecs
    }

    public getValue(): number {
        return this._value
    }

    constructor(
        private bot: Bot,
        private spec: ConnectorSpec
    ) {
        this.sensorId = "connector-sensor." + nextId()
    }

    public destroy() {}

    /**
     * Freeze the sensor type and initialize the appropriate physics shapes.
     * Subsequent calls with any type are ignored once frozen.
     */
    public setType(type: SensorType): void {
        if (this._frozen || type === SensorType.None) return
        this._type = type
        this._frozen = true

        if (type === SensorType.Gray || type === SensorType.Light) {
            this._initContactShapes()
        } else if (type === SensorType.Distance) {
            this._initDistanceShapes()
        }
    }

    private _initContactShapes(): void {
        const pos = this.spec.offset

        this._onSpec = {
            ...defaultEntityShape(),
            ...defaultCircleShape(),
            label: this.sensorId + ".on",
            offset: pos,
            radius: 0.5,
            brush: {
                ...defaultColorBrush(),
                fillColor: "white",
                borderColor: "white",
                borderWidth: 0.1,
                visible: false,
                zIndex: 6,
            },
            physics: {
                ...defaultShapePhysics(),
                friction: 0,
                restitution: 0,
                density: 0,
                sensor: true,
            },
        }
        this._offSpec = {
            ...defaultEntityShape(),
            ...defaultCircleShape(),
            label: this.sensorId + ".off",
            offset: pos,
            radius: 0.5,
            brush: {
                ...defaultColorBrush(),
                fillColor: "black",
                borderColor: "black",
                borderWidth: 0.1,
                visible: true,
                zIndex: 6,
            },
            physics: {
                ...defaultShapePhysics(),
                friction: 0,
                restitution: 0,
                density: 0,
                sensor: true,
            },
        }
        this._contactSpec = {
            ...defaultEntityShape(),
            ...defaultCircleShape(),
            label: this.sensorId + ".sensor",
            offset: pos,
            radius: 0.3,
            roles: ["line-sensor"],
            brush: {
                ...defaultColorBrush(),
                fillColor: "transparent",
                borderColor: "transparent",
                borderWidth: 0,
                zIndex: 1,
            },
            physics: {
                ...defaultShapePhysics(),
                friction: 0,
                restitution: 0,
                density: 0,
                sensor: true,
            },
        }
        this._shapeSpecs = [this._onSpec, this._offSpec, this._contactSpec]
    }

    private _initDistanceShapes(): void {
        const pos = this.spec.offset

        const pLeftNear = Vec2.like(-SENSOR_HALF_WIDTH, 0)
        const pRightNear = Vec2.like(SENSOR_HALF_WIDTH, 0)
        const pLeftFar = Vec2.rotateDeg(
            Vec2.add(pLeftNear, Vec2.like(0, -SENSOR_MAX_RANGE)),
            -SENSOR_BEAM_ANGLE / 2
        )
        const pRightFar = Vec2.rotateDeg(
            Vec2.add(pRightNear, Vec2.like(0, -SENSOR_MAX_RANGE)),
            SENSOR_BEAM_ANGLE / 2
        )
        const arcVerts = appoximateArc(
            Vec2.like(0, 0),
            SENSOR_MAX_RANGE,
            -SENSOR_BEAM_ANGLE / 2 - 90,
            SENSOR_BEAM_ANGLE / 2 - 90,
            4
        )
        this._sensorVerts = [
            pLeftNear,
            pRightNear,
            pRightFar,
            ...arcVerts.reverse(),
            pLeftFar,
            pLeftNear,
        ]
        this._sensorEdges = []
        for (let i = 1; i < this._sensorVerts.length; ++i) {
            this._sensorEdges.push(
                LineSegment.like(
                    this._sensorVerts[i - 1],
                    this._sensorVerts[i]
                )
            )
        }

        this._coneSpec = {
            ...defaultEntityShape(),
            ...defaultPolygonShape(),
            label: this.sensorId + ".cone",
            offset: pos,
            verts: this._sensorVerts,
            physics: {
                ...defaultShapePhysics(),
                sensor: true,
                density: 0,
            },
            brush: {
                ...defaultColorBrush(),
                visible: false,
            },
        }
        this._visualSpec = {
            ...defaultEntityShape(),
            ...defaultPolygonShape(),
            label: this.sensorId + ".visual",
            offset: pos,
            verts: this._sensorVerts,
            physics: {
                ...defaultShapePhysics(),
                sensor: true,
                density: 0,
            },
            brush: {
                ...defaultShaderBrush(),
                shader: "connector_sonar_wave",
                uniforms: {
                    uColor: rgbToFloatArray(waveColor),
                    uMaxRange: toRenderScale(SENSOR_MAX_RANGE),
                    uBeamAngle: toRadians(SENSOR_BEAM_ANGLE),
                },
                visible: true,
                zIndex: 5,
            },
        }
        this._targetSpec = {
            ...defaultEntityShape(),
            ...defaultPolygonShape(),
            label: this.sensorId + ".target",
            verts: [
                { x: -pingRadius, y: -pingRadius },
                { x: pingRadius, y: -pingRadius },
                { x: pingRadius, y: pingRadius },
                { x: -pingRadius, y: pingRadius },
            ],
            physics: {
                ...defaultShapePhysics(),
                sensor: true,
                density: 0,
            },
            brush: {
                ...defaultShaderBrush(),
                shader: "connector_sonar_ping",
                uniforms: {
                    uColor: rgbToFloatArray(pingColor),
                    uRadius: toRenderScale(pingRadius),
                },
                visible: false,
                zIndex: 6,
            },
        }
        this._shapeSpecs = [this._coneSpec, this._visualSpec, this._targetSpec]
    }

    public update(dtSecs: number): void {
        if (!this._frozen) return

        if (this._type === SensorType.Gray || this._type === SensorType.Light) {
            this._updateContact()
        } else if (this._type === SensorType.Distance) {
            this._updateDistance()
        }
    }

    private _updateContact(): void {
        let detecting = false

        for (
            let ce = this.bot.entity.physicsObj.body.getContactList();
            ce;
            ce = ce.next ?? null
        ) {
            const contact = ce.contact
            const fixtureA = contact.getFixtureA()
            const fixtureB = contact.getFixtureB()
            const userDataA = fixtureA.getUserData() as EntityShapeSpec
            const userDataB = fixtureB.getUserData() as EntityShapeSpec
            if (!userDataA || !userDataB) continue
            const labelA = userDataA.label
            const labelB = userDataB.label
            const rolesA = userDataA.roles
            const rolesB = userDataB.roles

            if (
                labelA === this.sensorId + ".sensor" &&
                rolesB.includes("follow-line")
            ) {
                if (testOverlap(fixtureA, fixtureB)) {
                    detecting = true
                }
            } else if (
                labelB === this.sensorId + ".sensor" &&
                rolesA.includes("follow-line")
            ) {
                if (testOverlap(fixtureA, fixtureB)) {
                    detecting = true
                }
            }
        }

        this._value = detecting ? 100 : 0

        const onShape = this.bot.entity.renderObj.shapes.get(
            this.sensorId + ".on"
        )
        const offShape = this.bot.entity.renderObj.shapes.get(
            this.sensorId + ".off"
        )
        if (onShape) onShape.visible = detecting
        if (offShape) offShape.visible = !detecting
    }

    private _updateDistance(): void {
        if (
            !this._coneSpec ||
            !this._visualSpec ||
            !this._sensorVerts ||
            !this._sensorEdges
        )
            return

        this._value = SENSOR_MAX_RANGE

        const botPos = this.bot.pos
        const sensorAngle = this.bot.angle
        const sensorPos = Vec2.transformDeg(
            this._visualSpec.offset,
            botPos,
            sensorAngle
        )

        const overlaps: Planck.Fixture[] = []
        const detectedVerts: Vec2Like[] = []

        const sensorVerts = this._sensorVerts.map((v) =>
            Vec2.transformDeg(v, sensorPos, sensorAngle)
        )
        const sensorEdges = this._sensorEdges.map((e) =>
            LineSegment.transformDeg(e, sensorPos, sensorAngle)
        )

        const isObstacle = (roles: string[]) =>
            roles.includes("obstacle") || roles.includes("robot")
        const isMe = (fixture: Planck.Fixture) =>
            fixture.getBody() === this.bot.entity.physicsObj.body

        for (
            let ce = this.bot.entity.physicsObj.body.getContactList();
            ce;
            ce = ce.next ?? null
        ) {
            const contact = ce.contact
            const fixtureA = contact.getFixtureA()
            const fixtureB = contact.getFixtureB()
            const userDataA = fixtureA.getUserData() as EntityShapeSpec
            const userDataB = fixtureB.getUserData() as EntityShapeSpec
            if (!userDataA || !userDataB) continue
            const rolesA = userDataA.roles
            const rolesB = userDataB.roles

            if (
                userDataA.label === this._coneSpec.label &&
                isObstacle(rolesB) &&
                !isMe(fixtureB) &&
                testOverlap(fixtureA, fixtureB)
            ) {
                overlaps.push(fixtureB)
            } else if (
                userDataB.label === this._coneSpec.label &&
                isObstacle(rolesA) &&
                !isMe(fixtureA) &&
                testOverlap(fixtureA, fixtureB)
            ) {
                overlaps.push(fixtureA)
            }
        }

        const ingestEdge = (p0: Vec2Like, p1: Vec2Like) => {
            if (pointInPolygon(p0, sensorVerts)) detectedVerts.push(p0)
            if (pointInPolygon(p1, sensorVerts)) detectedVerts.push(p1)
            const isects = LineSegment.intersectionAll({ p0, p1 }, sensorEdges)
            isects.forEach((isect) => {
                if (isect.type === "point") detectedVerts.push(isect.p)
            })
        }
        const ingestPolyline = (verts: Vec2Like[], closed: boolean) => {
            if (verts.length < 2) return
            for (
                let i = 1;
                closed ? i <= verts.length : i < verts.length;
                ++i
            ) {
                ingestEdge(verts[i - 1], verts[i % verts.length])
            }
        }

        for (const fixture of overlaps) {
            const overlapShape = fixture.getShape()
            const itPos = fixture.getBody().getPosition()
            const itAngle = fixture.getBody().getAngle()
            switch (overlapShape.getType()) {
                case "circle": {
                    const circleShape = overlapShape as Planck.Circle
                    const circleCenter = Vec2.transform(
                        circleShape.m_p,
                        itPos,
                        itAngle
                    )
                    const verts = appoximateArc(
                        circleCenter,
                        circleShape.getRadius(),
                        0,
                        360,
                        16
                    )
                    ingestPolyline(verts, true)
                    break
                }
                case "polygon": {
                    const polygonShape = overlapShape as Planck.Polygon
                    const verts = polygonShape.m_vertices.map((v) =>
                        Vec2.transform(v, itPos, itAngle)
                    )
                    ingestPolyline(verts, true)
                    break
                }
                default:
                    break
            }
        }

        detectedVerts.sort((a, b) => {
            const aLen = Vec2.lenSq(Vec2.sub(a, sensorPos))
            const bLen = Vec2.lenSq(Vec2.sub(b, sensorPos))
            return aLen - bLen
        })
        const nearest = detectedVerts.shift()

        if (nearest) {
            this._value = Math.min(
                Vec2.len(Vec2.sub(nearest, sensorPos)),
                SENSOR_MAX_RANGE
            )
        }

        const targetRenderable = this.bot.entity.renderObj.shapes.get(
            this.sensorId + ".target"
        )
        if (targetRenderable) {
            targetRenderable.visible = !!nearest
            if (nearest) {
                const pt = Vec2.scale(
                    Vec2.untransformDeg(nearest, botPos, sensorAngle),
                    RENDER_SCALE
                )
                targetRenderable.gfx.position.set(pt.x, pt.y)
            }
        }
    }
}

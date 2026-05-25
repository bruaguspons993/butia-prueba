import { BotSpec, toWheels } from "./specs"

const spec: BotSpec = {
    name: "Butia v4",
    productId: 0x4254,
    mass: 1,
    weight: 200,
    silkColor: "#1a1a2e",
    chassis: {
        shape: "box",
        size: { x: 15, y: 12 },
    },
    wheels: toWheels({
        separation: 11,
        diameter: 6.5,
        width: 2,
        y: 0,
    }),
    ballast: {
        pos: { x: 0, y: 1 },
        size: { x: 6, y: 3 },
        mass: 80,
    },
    connectors: [
        { name: "J1", offset: { x: -3, y: -4 } },
        { name: "J2", offset: { x: 3, y: -4 } },
        { name: "J3", offset: { x: 0, y: -5.5 } },
        { name: "J4", offset: { x: -3, y: 2 } },
        { name: "J5", offset: { x: 3, y: 2 } },
    ],
    leds: [
        {
            name: "general",
            pos: { x: 0, y: 0 },
            radius: 0,
        },
    ],
}

export default spec

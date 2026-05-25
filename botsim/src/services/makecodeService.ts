import { Simulation } from "../sim"
import { MAPS } from "../maps"
import { BOTS, DEFAULT_BOT } from "../bots"
import {
    BUTIA_CHANNEL,
    ButiaStateMessage,
    ButiaSensorsMessage,
} from "../external/protocol"

const DEFAULT_DEVICE_ID = 0

function stopSim() {
    Simulation.instance.stop()
}

function restartSim() {
    const sim = Simulation.instance
    sim.stop()
    sim.clear()
    const map = MAPS["Test Map"]?.()
    if (map) sim.loadMap(map)
    sim.start()
}

function postMessagePacket(msg: ButiaSensorsMessage) {
    const payload = new TextEncoder().encode(JSON.stringify(msg))
    window.parent.postMessage(
        {
            type: "messagepacket",
            channel: BUTIA_CHANNEL,
            data: payload,
        },
        "*"
    )
}

function handleButiaMessage(buf: any) {
    const text = new TextDecoder().decode(new Uint8Array(buf))
    const msg = JSON.parse(text) as ButiaStateMessage

    if (msg.type !== "state") return

    const sim = Simulation.instance
    const bot =
        sim.bot(DEFAULT_DEVICE_ID) ??
        sim.spawnBot(DEFAULT_DEVICE_ID, BOTS[DEFAULT_BOT])
    if (!bot) return

    bot.setMotors(msg.motorLeft, msg.motorRight)
    bot.setConnectorTypes(msg.connectors)

    const reply: ButiaSensorsMessage = {
        type: "sensors",
        connectors: bot.readConnectors(),
    }
    postMessagePacket(reply)
}

function handleMessagePacket(msg: any) {
    switch (msg.channel) {
        case BUTIA_CHANNEL:
            return handleButiaMessage(msg.data)
        default:
            console.log(`unknown messagepacket channel: ${msg.channel}`)
    }
}

function handleDebuggerMessage(msg: any) {
    switch (msg.subtype) {
        case "traceConfig":
            restartSim()
            break
        case "stepinto":
            Simulation.instance.unpauseBots()
            break
        case "pause":
            Simulation.instance.pauseBots()
            break
        case "resume":
            Simulation.instance.unpauseBots()
            break
        default:
            console.log(`unknown debugger message: ${JSON.stringify(msg)}`)
    }
}

export function init() {
    window.addEventListener("message", (ev) => {
        if (ev.data?.source?.startsWith("react-devtools")) return
        if (ev.data?.type?.startsWith("webpack")) return
        if (ev.data?.startsWith?.("webpack")) return

        try {
            switch (ev.data?.type) {
                case "messagepacket":
                    return handleMessagePacket(ev.data)
                case "stop":
                    return stopSim()
                case "run":
                    return restartSim()
                case "debugger":
                    return handleDebuggerMessage(ev.data)
                case "bulkserial":
                    return
                case "stopsound":
                    return
            }
            console.log(`unknown message: ${JSON.stringify(ev.data)}`)
        } catch (e) {
            console.error(e)
        }
    })
}

// Development helper — call from browser console:
// import { sendTestState } from "./services/makecodeService"
// or: window.__makecodeService.sendTestState(msg)
export function sendTestState(msg: ButiaStateMessage): void {
    handleButiaMessage(new TextEncoder().encode(JSON.stringify(msg)))
}

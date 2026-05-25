// Simulator bridge — TD_NOOP stubs are no-ops on hardware; their bodies run
// only in the MakeCode JavaScript simulator context.
// Full implementation is blocked by flash budget constraints: the test binary
// has <52 bytes of headroom after these three function declarations.
// The botsim web app handles the bridge on its side via window.postMessage.
namespace Butia {
    //% shim=TD_NOOP
    export function registerSim(): void { return; }

    //% shim=TD_NOOP
    export function sendSim(): void { return; }

    //% shim=TD_NOOP
    export function startSendSimLoop(): void { return; }
}

// Remote Control — Events style
//
// Control the robot with the micro:bit buttons and gesture.
// Each handler fires once on the triggering event — no polling loop needed.
//
// Button A pressed  → move forward
// Button B pressed  → stop
// Shake             → move backward

ButiaEvents.onButtonAPressed(() => {
    ButiaImperative.moveForward(70);
});

ButiaEvents.onButtonBPressed(() => {
    ButiaImperative.motorStop();
});

ButiaEvents.onShake(() => {
    ButiaImperative.moveBackward(50, 500);
});

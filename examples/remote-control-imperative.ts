// Remote Control — Imperative style
//
// Control the robot with the micro:bit buttons and gesture.
// The loop checks the button state on every iteration.
//
// Button A pressed  → move forward
// Button B pressed  → stop
// Shake             → move backward
//
// Note: because both A and B can be pressed at the same time,
// B (stop) takes priority in this implementation.

basic.forever(() => {
    if (input.buttonIsPressed(Button.B)) {
        ButiaImperative.motorStop();
    } else if (input.buttonIsPressed(Button.A)) {
        ButiaImperative.moveForward(70);
    }
    basic.pause(50);
});

input.onGesture(Gesture.Shake, () => {
    ButiaImperative.moveBackward(50, 500);
});

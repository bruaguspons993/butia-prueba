// Obstacle Avoidance — Events style
//
// The robot starts moving forward and reacts only when the obstacle
// state changes (near ↔ far). No continuous polling — the sensor
// bridge fires the event on every near/far transition.
//
// onObstacleNear  → stop, back up, turn right
// onObstacleFar   → resume moving forward

ButiaImperative.moveForward(70);

ButiaEvents.onObstacleNear(() => {
    ButiaImperative.motorStop();
    basic.pause(300);
    ButiaImperative.moveBackward(50, 400);
    ButiaImperative.turn(TurnDirection.Right, 50, 500);
});

ButiaEvents.onObstacleFar(() => {
    ButiaImperative.moveForward(70);
});

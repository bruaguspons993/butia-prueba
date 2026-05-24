// Line Follower — Events style
//
// The robot registers handlers for each line-sensor state change
// and reacts only when something actually changes.
// The logic is identical to the imperative version, but the robot
// does not poll — it waits for the sensor bridge to notify it.
//
// Both sensors on line  → go straight
// Left sensor only      → veer left
// Right sensor only     → veer right
// No sensor on line     → stop (line lost)

ButiaEvents.onLineBoth(() => {
    ButiaImperative.moveForward(60);
});

ButiaEvents.onLineLeft(() => {
    ButiaImperative.turn(TurnDirection.Left, 40);
});

ButiaEvents.onLineRight(() => {
    ButiaImperative.turn(TurnDirection.Right, 40);
});

ButiaEvents.onLineNone(() => {
    ButiaImperative.motorStop();
});

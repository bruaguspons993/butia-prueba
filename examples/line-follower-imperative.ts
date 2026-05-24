// Line Follower — Imperative style
//
// The robot polls both line sensors on every loop iteration and
// adjusts direction immediately based on what it reads.
//
// Both sensors on line  → go straight
// Left sensor only      → veer left
// Right sensor only     → veer right
// No sensor on line     → stop (line lost)

basic.forever(() => {
    const left = ButiaImperative.detectLine(LineSensorId.Left);
    const right = ButiaImperative.detectLine(LineSensorId.Right);

    if (left && right) {
        ButiaImperative.moveForward(60);
    } else if (left) {
        ButiaImperative.turn(TurnDirection.Left, 40);
    } else if (right) {
        ButiaImperative.turn(TurnDirection.Right, 40);
    } else {
        ButiaImperative.motorStop();
    }
});

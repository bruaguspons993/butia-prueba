// Obstacle Avoidance — Imperative style
//
// The robot moves forward and continuously checks the distance sensor.
// When an obstacle is closer than 15 cm it stops, backs up, and turns.
// Once the path is clear it resumes moving forward.
//
// This version reads the sensor on every loop iteration, so it reacts
// as fast as the loop runs.

const SAFE_DISTANCE_CM = 15;

basic.forever(() => {
    if (ButiaImperative.obstacleDistance() <= SAFE_DISTANCE_CM) {
        ButiaImperative.motorStop();
        basic.pause(300);
        ButiaImperative.moveBackward(50, 400);
        ButiaImperative.turn(TurnDirection.Right, 50, 500);
    } else {
        ButiaImperative.moveForward(70);
    }
});

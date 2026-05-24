// Mock-based behavioral tests for RobotBase — motor control and sensor reads.
// Mocks live in test/_mocks.ts.

// --- Motor behavioral tests ---

const motors = new MockMotorDriver();
const motorRobot = new Butia.RobotBase(motors, []);

motorRobot.moveForward(60);
assertTest(motors.left === 60 && motors.right === 60, "moveForward speed");

motorRobot.moveBackward(50);
assertTest(motors.left === -50 && motors.right === -50, "moveBackward speed");

motorRobot.turn(TurnDirection.Left, 40);
assertTest(motors.left === -40 && motors.right === 40, "turn left");

motorRobot.turn(TurnDirection.Right, 40);
assertTest(motors.left === 40 && motors.right === -40, "turn right");

motorRobot.motorTank(50, -30);
assertTest(motors.left === 50 && motors.right === -30, "motorTank");

motorRobot.motorStop();
assertTest(motors.left === 0 && motors.right === 0, "motorStop");

basic.showString("ALL PASS motors");

// --- Sensor read tests ---

const sensorConfig: Butia.ConnectorPin[] = [
    new Butia.ConnectorPin(Butia.J1, AnalogPin.P1),
    new Butia.ConnectorPin(Butia.J2, AnalogPin.P2),
    new Butia.ConnectorPin(Butia.J3, AnalogPin.P3),
];
const sensorRobot = new MockRobot(new MockMotorDriver(), sensorConfig);
sensorRobot.mockLight(AnalogPin.P1, new MockSensor(AnalogPin.P1, 750));
sensorRobot.mockLight(AnalogPin.P2, new MockSensor(AnalogPin.P2, 200));
sensorRobot.mockGray(AnalogPin.P2, new MockSensor(AnalogPin.P2, 300));
sensorRobot.mockDistance(AnalogPin.P3, new MockSensor(AnalogPin.P3, 25));

sensorRobot.mockButton(AnalogPin.P1, new MockSensor(AnalogPin.P1, 1));
sensorRobot.mockButton(AnalogPin.P2, new MockSensor(AnalogPin.P2, 0));

assertTest(sensorRobot.readLightSensor(Butia.J1) === 750, "readLightSensor J1");
assertTest(sensorRobot.readLightSensor(Butia.J2) === 200, "readLightSensor J2 (multi-sensor lookup)");
assertTest(sensorRobot.readGraySensor(Butia.J2) === 300, "readGraySensor");
assertTest(sensorRobot.readDistanceSensor(Butia.J3) === 25, "readDistanceSensor");
assertTest(sensorRobot.readButton(Butia.J1) === true, "readButton pressed");
assertTest(sensorRobot.readButton(Butia.J2) === false, "readButton released");

basic.showString("ALL PASS sensors");

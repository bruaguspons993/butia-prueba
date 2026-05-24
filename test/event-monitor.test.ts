// Event system tests. Drives the EventMonitor synchronously via
// _stepEventMonitor() (which returns the subIds fired this cycle), so
// assertions don't depend on the PXT event scheduler.
// Mocks come from test/_mocks.ts.

const eCfg: Butia.ConnectorPin[] = [
    new Butia.ConnectorPin(Butia.J1, AnalogPin.P1),
    new Butia.ConnectorPin(Butia.J2, AnalogPin.P2),
];

// --- computeSubId determinism ---

const sA = Butia.computeSubId(Butia.SENSOR_TYPE_LIGHT, AnalogPin.P1, Butia.DIR_GREATER_OR_PRESSED);
const sB = Butia.computeSubId(Butia.SENSOR_TYPE_LIGHT, AnalogPin.P1, Butia.DIR_GREATER_OR_PRESSED);
assertTest(sA === sB, "computeSubId deterministic");
assertTest(sA !== Butia.computeSubId(Butia.SENSOR_TYPE_LIGHT, AnalogPin.P1, Butia.DIR_LESS_OR_RELEASED), "subId by direction");
assertTest(sA !== Butia.computeSubId(Butia.SENSOR_TYPE_GRAY, AnalogPin.P1, Butia.DIR_GREATER_OR_PRESSED), "subId by sensor type");
assertTest(sA !== Butia.computeSubId(Butia.SENSOR_TYPE_LIGHT, AnalogPin.P2, Butia.DIR_GREATER_OR_PRESSED), "subId by pin");

// --- onDistance Less: rising-edge + invalid-reading guard ---

const rD = new MockRobot(new MockMotorDriver(), eCfg);
const sD = new MockSensor(AnalogPin.P1, 50);
rD.mockDistance(AnalogPin.P1, sD);
rD.onDistance(Butia.J1, Comparison.Less, 20, () => { });

assertTest(rD._stepEventMonitor().length === 0, "onDistance Less: above threshold no-fire");
sD.setValue(10);
assertTest(rD._stepEventMonitor().length === 1, "onDistance Less: crosses below fires");
assertTest(rD._stepEventMonitor().length === 0, "onDistance Less: sustained no-refire");
sD.setValue(50); rD._stepEventMonitor();
sD.setValue(10);
assertTest(rD._stepEventMonitor().length === 1, "onDistance Less: refires after exit/re-enter");
sD.setValue(50); rD._stepEventMonitor();
sD.setValue(0);
assertTest(rD._stepEventMonitor().length === 0, "onDistance Less: zero reading ignored");
sD.setValue(-5);
assertTest(rD._stepEventMonitor().length === 0, "onDistance Less: negative reading ignored");

// --- onLight: Greater and Less ---

const rL = new MockRobot(new MockMotorDriver(), eCfg);
const sL1 = new MockSensor(AnalogPin.P1, 30);
const sL2 = new MockSensor(AnalogPin.P2, 80);
rL.mockLight(AnalogPin.P1, sL1);
rL.mockLight(AnalogPin.P2, sL2);
rL.onLight(Butia.J1, Comparison.Greater, 70, () => { });
rL.onLight(Butia.J2, Comparison.Less, 30, () => { });

assertTest(rL._stepEventMonitor().length === 0, "onLight: neither fires initially");
sL1.setValue(85); sL2.setValue(10);
assertTest(rL._stepEventMonitor().length === 2, "onLight: both Greater and Less fire");

// --- onGray Greater ---

const rG = new MockRobot(new MockMotorDriver(), eCfg);
const sG = new MockSensor(AnalogPin.P1, 20);
rG.mockGray(AnalogPin.P1, sG);
rG.onGray(Butia.J1, Comparison.Greater, 50, () => { });
assertTest(rG._stepEventMonitor().length === 0, "onGray Greater: below no-fire");
sG.setValue(75);
assertTest(rG._stepEventMonitor().length === 1, "onGray Greater: fires");

// --- evalComparison: >= and <= fire at boundary equality ---

assertTest(
    Butia.evalComparison(Comparison.GreaterOrEqual, 70, 70) &&
    Butia.evalComparison(Comparison.LessOrEqual, 30, 30),
    "GE/LE boundary"
);

// --- onConnectorButton: Pressed and Released ---

const rB = new MockRobot(new MockMotorDriver(), eCfg);
const sB1 = new MockSensor(AnalogPin.P1, 0);
const sB2 = new MockSensor(AnalogPin.P2, 1);
rB.mockButton(AnalogPin.P1, sB1);
rB.mockButton(AnalogPin.P2, sB2);
rB.onConnectorButton(Butia.J1, ButtonState.Pressed, () => { });
rB.onConnectorButton(Butia.J2, ButtonState.Released, () => { });

assertTest(rB._stepEventMonitor().length === 0, "onConnectorButton: initial no-fire");
sB1.setValue(1); sB2.setValue(0);
assertTest(rB._stepEventMonitor().length === 2, "onConnectorButton: press and release fire");
assertTest(rB._stepEventMonitor().length === 0, "onConnectorButton: sustained no-refire");

basic.showString("ALL PASS events");

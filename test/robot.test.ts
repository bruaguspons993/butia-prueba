// Tests for RobotDriver singleton lifecycle.

Butia.RobotDriver.start(Butia.Butia4_1_0);
Butia.RobotDriver.start(Butia.Butia4_1_0); // segunda llamada con la misma instancia debe ser no-op, no crashear

Butia.RobotDriver.instance(); // debe retornar sin tirar excepción
basic.showString("PASS singleton");

basic.showString("ALL PASS robot");

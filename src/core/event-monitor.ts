// EventMonitor: centralized sensor polling and event dispatch.
//
// A single background fiber (lazy-started on the first register call) iterates
// a dynamic list of sensor monitors every 100 ms. Each monitor encapsulates
// its own evaluation closure, so the poller stays agnostic to sensor type.
// Rising-edge detection prevents repeated firing while the condition holds.

namespace Butia {
    export const BUTIA_EVENT_ID = 6500;

    // Sensor type tags used to build deterministic event sub-IDs.
    export const SENSOR_TYPE_LIGHT = 1;
    export const SENSOR_TYPE_GRAY = 2;
    export const SENSOR_TYPE_DISTANCE = 3;
    export const SENSOR_TYPE_BUTTON = 4;

    // Direction tags inside the sub-ID.
    //  0 = Greater         (or button Pressed)
    //  1 = Less            (or button Released)
    //  2 = GreaterOrEqual
    //  3 = LessOrEqual
    export const DIR_GREATER_OR_PRESSED = 0;
    export const DIR_LESS_OR_RELEASED = 1;
    export const DIR_GREATER_OR_EQUAL = 2;
    export const DIR_LESS_OR_EQUAL = 3;

    export function comparisonToDir(op: Comparison): number {
        if (op === Comparison.Greater) return DIR_GREATER_OR_PRESSED;
        if (op === Comparison.Less) return DIR_LESS_OR_RELEASED;
        if (op === Comparison.GreaterOrEqual) return DIR_GREATER_OR_EQUAL;
        return DIR_LESS_OR_EQUAL;
    }

    export function evalComparison(op: Comparison, value: number, threshold: number): boolean {
        if (op === Comparison.Greater) return value > threshold;
        if (op === Comparison.Less) return value < threshold;
        if (op === Comparison.GreaterOrEqual) return value >= threshold;
        return value <= threshold;
    }

    export interface IMonitor {
        subId: number;
        evaluate: () => boolean;
        lastTriggered: boolean;
    }

    // Pure: used by both control.onEvent (handler side) and control.raiseEvent
    // (poller side). Keeping it pure guarantees both sides agree on the ID.
    export function computeSubId(sensorType: number, pin: number, direction: number): number {
        return sensorType * 10000 + pin * 10 + direction;
    }

    export class EventMonitor {
        private _monitors: IMonitor[];
        private _started: boolean;

        constructor() {
            this._monitors = [];
            this._started = false;
        }

        register(monitor: IMonitor): void {
            this._monitors.push(monitor);
            this._ensureStarted();
        }

        // Runs a single polling cycle synchronously. Returns the list of
        // subIds that fired this cycle so tests can assert rising-edge
        // behavior without depending on the PXT event scheduler. The
        // background loop ignores the return value.
        pollOnce(): number[] {
            const fired: number[] = [];
            for (const m of this._monitors) {
                const triggered = m.evaluate();
                if (triggered && !m.lastTriggered) {
                    control.raiseEvent(BUTIA_EVENT_ID, m.subId);
                    fired.push(m.subId);
                }
                m.lastTriggered = triggered;
            }
            return fired;
        }

        protected _ensureStarted(): void {
            if (this._started) return;
            this._started = true;
            control.inBackground(() => {
                while (true) {
                    this.pollOnce();
                    basic.pause(100);
                }
            });
        }
    }
}

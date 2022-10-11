export {
    setTimeout as timeout,
    setImmediate as immediate,
    setInterval as interval,
} from "node:timers/promises";

export function tick(): Promise<void> {
    return new Promise(res => process.nextTick(res));
}

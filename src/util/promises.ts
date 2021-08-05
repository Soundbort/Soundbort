export function timeout(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

export function immediate(): Promise<void> {
    return new Promise(res => setImmediate(res));
}

export function tick(): Promise<void> {
    return new Promise(res => process.nextTick(res));
}

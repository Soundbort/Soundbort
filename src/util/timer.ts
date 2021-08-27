function timer(): bigint {
    return process.hrtime.bigint();
}
timer.NS_PER_SEC = 1e9;
timer.NS_PER_MS = 1e6;
timer.typeof = "bigint";
timer.diff = function diff(start: bigint) {
    return Number(timer() - start);
};
timer.diffMs = function diffMs(start: bigint) {
    return Number(timer() - start) / timer.NS_PER_MS;
};

export default timer;

export function perfLogStartPreprocessing() {
    console.log(`[PERF] Started preprocessing - ${(new Date()).getTime()}`);
}

export function perfLogStartDbTransaction() {
    console.log(`[PERF] Started transaction - ${(new Date()).getTime()}`);
}

export function perfLogAfterDbTransaction() {
    console.log(`[PERF] Completed transaction - ${(new Date()).getTime()}`);
}

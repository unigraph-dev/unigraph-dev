export function perfLogStartPreprocessing () {
    console.log("Started preprocessing - " + (new Date()).getUTCDate)
}

export function perfLogStartDbTransaction () {
    console.log("Started transaction - " + (new Date()).getUTCDate)
}

export function perfLogAfterDbTransaction () {
    console.log("Completed transaction - " + (new Date()).getUTCDate)
}
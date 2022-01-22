import _ from 'lodash';

/* eslint-disable no-param-reassign */
function getPath(obj: any, path: string | string[]): any {
    if (path.length === 0) return new UnigraphObject(obj);
    if (!Array.isArray(path)) path = path.split('/').filter((e) => e.length);
    const values = Object.keys(obj).filter((el) => el.startsWith('_value'));
    if (values.length > 1) {
        throw new TypeError('Object should have one value only');
    } else if (values.length === 1) {
        return getPath(obj[values[0]], path);
    } else if (Object.keys(obj).includes(path[0])) {
        return getPath(obj[path[0]], path.slice(1));
    } else {
        return undefined;
        // throw new RangeError('Requested path doesn\'t exist')
    }
}

export function findUid(object: any, uid: string, path?: any[]) {
    const currentPath = [...(path || [])];
    if (
        object?.['dgraph.type'] === 'Entity' ||
        object?.['dgraph.type']?.includes('Entity') ||
        object?.type?.['unigraph.id']?.startsWith('$/schema')
    ) {
        currentPath.push(object);
    }
    if (object?.uid === uid) return [object, currentPath];
    if (typeof object === 'object' && object) {
        if (Array.isArray(object)) {
            for (const el of object) {
                const result: any = findUid(el, uid, currentPath);
                if (result[0]) return result;
            }
        } else {
            const keys = Object.keys(object);
            for (let i = 0; i < keys.length; i += 1) {
                const result: any = findUid(object[keys[i]], uid, currentPath);
                if (result[0]) return result;
            }
        }
    }
    return [undefined, currentPath];
}

export function assignUids(object: any, totalLeases: string[], usedLeases: string[], blankMap: any) {
    if (typeof object === 'object' && object) {
        if (Array.isArray(object)) {
            for (const el of object) {
                assignUids(el, totalLeases, usedLeases, blankMap);
            }
        } else {
            const keys = Object.keys(object);
            if (keys.includes('unigraph.id')) return;
            if (!keys.includes('uid')) {
                // Assign a new uid to the object
                const newUid = totalLeases.shift();
                if (!newUid) throw new RangeError('No more uids available');
                object.uid = newUid;
                usedLeases.push(newUid);
            } else if (object.uid?.startsWith?.('_:')) {
                if (blankMap[object.uid]) {
                    object.uid = blankMap[object.uid];
                } else {
                    const newUid = totalLeases.shift();
                    if (!newUid) throw new RangeError('No more uids available');
                    blankMap[object.uid] = newUid;
                    object.uid = newUid;
                    usedLeases.push(newUid);
                }
            }
            for (let i = 0; i < keys.length; i += 1) {
                assignUids(object[keys[i]], totalLeases, usedLeases, blankMap);
            }
        }
    }
}

export const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key: any, value: any) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        // eslint-disable-next-line consistent-return
        return value;
    };
};

/**
 * Augment a object with previous values in the same UIDs.
 * @param objWithStubs The new object with stubs.
 * @param origObj Original object with full values of the same UIDs.
 */
export function augmentStubs(objWithStubs: any, origObj: any) {
    const uidDict: any = {};

    function recurseOrig(curr: any, seen: any[] = []) {
        if (typeof curr === 'object' && curr) {
            if (Array.isArray(curr)) {
                curr.forEach((el) => recurseOrig(el, seen));
            } else {
                if (curr.uid && seen.includes(curr.uid)) return;
                if (curr.uid) seen = [...seen, curr.uid];
                if (curr.uid && Object.keys(curr).length >= 2) {
                    uidDict[curr.uid] = curr;
                }
                Object.keys(curr).forEach((el) => {
                    recurseOrig(curr[el], seen);
                });
            }
        }
    }

    function recurseObj(curr: any, seen: any[] = []) {
        if (typeof curr === 'object' && curr) {
            if (Array.isArray(curr)) {
                curr.forEach((el) => recurseObj(el, seen));
            } else {
                if (curr.uid && seen.includes(curr.uid)) return;
                if (curr.uid) seen = [...seen, curr.uid];
                Object.keys(curr).forEach((el) => {
                    recurseObj(curr[el], seen);
                });
                if (
                    curr.uid &&
                    uidDict[curr.uid] &&
                    Object.keys(curr).length <= 2 &&
                    _.difference(Object.keys(uidDict[curr.uid]), Object.keys(curr)).length > 0
                ) {
                    Object.assign(curr, uidDict[curr.uid], JSON.parse(JSON.stringify(curr)));
                }
            }
        }
    }

    recurseOrig(origObj);
    recurseObj(objWithStubs);
    // console.log(uidDict);
}

function getObjectAsRecursivePrimitive(object: any) {
    let targetValue: any;
    Object.keys(object).forEach((el) => {
        if (el.startsWith('_value.')) {
            targetValue = object[el];
        } else if (el.startsWith('_value') && typeof object[el] === 'object') {
            const subObj = getObjectAsRecursivePrimitive(object[el]);
            if (subObj || subObj === '' || subObj === 0 || subObj === false) targetValue = subObj;
        }
    });
    return targetValue;
}

export const getObjectAs = (object: any, type: 'primitive') => {
    if (type === 'primitive') {
        return getObjectAsRecursivePrimitive(object);
    }
    return object;
};

// TODO: Switch to prototype-based, faster helper functions
// TODO: Benchmark these helper functions
export class UnigraphObject extends Object {
    constructor(obj: any) {
        super(obj);
        Object.setPrototypeOf(this, UnigraphObject.prototype);
    }

    get = (path: string | string[]) => {
        try {
            return getPath(this, path);
        } catch (e) {
            console.error(e);
            console.log(this);
            return e;
        }
    };

    // eslint-disable-next-line class-methods-use-this
    getMetadata = () => undefined;

    getType = () => (this as any).type['unigraph.id'];

    // eslint-disable-next-line class-methods-use-this
    getRefType = () => undefined;

    as = (type: string) => getObjectAs(this, type as any);
}

/**
 * Implement a graph-like data structure based on js pointers from uid references.
 *
 * Since pointers are not serializable, this must be done on the client side.
 *
 * @param objects Objects with uid references
 */
export function buildGraph(objects: UnigraphObject[]): UnigraphObject[] {
    const objs: any[] = [...objects].map((el: any) => new UnigraphObject(el));
    const dict: any = {};
    objs.forEach((object) => {
        if (object?.uid) dict[object.uid] = object;
    });

    function buildDictRecurse(obj: any, pastUids: any[] = []) {
        if (obj && typeof obj === 'object' && Array.isArray(obj)) {
            obj.forEach((val, index) => {
                if (val?.uid && !dict[val.uid] && Object.keys(val).filter((el) => el.startsWith('_value')).length > 0)
                    dict[val.uid] = obj[index];
                if (!pastUids.includes(val?.uid)) buildDictRecurse(val, [...pastUids, val?.uid]);
            });
        } else if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]: [key: string, value: any]) => {
                if (
                    value?.uid &&
                    !dict[value.uid] &&
                    Object.keys(value).filter((el) => el.startsWith('_value')).length > 0
                )
                    dict[value.uid] = obj[key];
                if (!pastUids.includes(value?.uid)) buildDictRecurse(value, [...pastUids, value?.uid]);
            });
        }
    }

    function buildGraphRecurse(obj: any, pastUids: any[] = []) {
        if (obj && typeof obj === 'object' && Array.isArray(obj)) {
            obj.forEach((val, index) => {
                if (val?.uid && dict[val.uid]) obj[index] = dict[val.uid];
                if (!pastUids.includes(val?.uid)) buildGraphRecurse(val, [...pastUids, val?.uid]);
            });
        } else if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]: [key: string, value: any]) => {
                if (value?.uid && dict[value.uid]) obj[key] = dict[value.uid];
                if (!pastUids.includes(value?.uid)) buildGraphRecurse(value, [...pastUids, value?.uid]);
            });
        }
    }

    objs.forEach((object) => buildDictRecurse(object));
    objs.forEach((object) => buildGraphRecurse(object));

    return objs;
}

export function getRandomInt() {
    return Math.floor(Math.random() * Math.floor(1000000));
}

export function getRandomId() {
    return `${getRandomInt()}${getRandomInt()}`;
}

export function isJsonString(str: any) {
    if (!(typeof str === 'string')) return false;
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return JSON.parse(str);
}

export function isUrl(str: string) {
    /* https://stackoverflow.com/a/5717133 */
    const pattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$',
        'i',
    ); // fragment locator
    return !!pattern.test(str);
}

export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('blob not a string'));
        };
    });
}

// https://stackoverflow.com/a/55257089
// FIXME: This should be fairly performant but still a synchronous compute-heavy action. consider fixing it
export function base64ToBlob(base64: string): Blob {
    // Decode Base64 string
    const decodedData = window.atob(base64);

    // Create UNIT8ARRAY of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);

    // Insert all character code into uInt8Array
    for (let i = 0; i < decodedData.length; i += 1) {
        uInt8Array[i] = decodedData.charCodeAt(i);
    }

    // Return BLOB image after conversion
    return new Blob([uInt8Array]);
}

export function blobToJson(blob: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
        blob.text().then((text) =>
            isJsonString(text) ? resolve(JSON.stringify(text)) : reject(new Error('blob not a json')),
        );
    });
}

export function getRefQueryUnigraphId(id: string) {
    return {
        $ref: {
            query: [
                {
                    key: 'unigraph.id',
                    value: id,
                },
            ],
        },
    };
}

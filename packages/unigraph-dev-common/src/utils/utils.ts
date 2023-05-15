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

/**
 * Merges a single source object to a target object.
 *
 * NOTE: this function mutates the target object.
 *
 * @param target
 * @param source
 */
export const deepMerge = (target: any, source: any, checkUid = true) => {
    const recurse = (targ: any, src: any) => {
        if (_.isArray(targ) && !_.isArray(src)) {
            src = [src];
        } else if (!_.isArray(targ) && _.isArray(src)) {
            targ = [targ];
        }

        if (_.isArray(targ) && _.isArray(src)) {
            const uids: string[] = [];
            const [[primObj, objObj], [primSrc, objSrc]] = [targ, src].map((arr) => {
                const objs: any[] = [];
                const prims: any[] = [];
                arr.forEach((el) => {
                    if (typeof el?.uid === 'string') {
                        objs.push(el);
                        uids.push(el.uid);
                    } else prims.push(el);
                });
                return [prims, objs];
            });
            const finPrims = _.uniq(primObj.concat(primSrc));
            const finObjs: any[] = [];
            _.uniq(uids).forEach((uid) => {
                const obj = objObj.find((el) => el.uid === uid);
                const srcc = objSrc.find((el) => el.uid === uid);
                if (obj && srcc) finObjs.push(recurse(obj, srcc));
                else if (obj) finObjs.push(obj);
                else if (srcc) finObjs.push(srcc);
            });
            return [...finPrims, ...finObjs];
        }

        if (checkUid && targ?.uid && src?.uid && targ.uid !== src.uid) {
            return src;
        }

        if (typeof src === 'undefined' || src === null) return targ;
        if (typeof targ === 'undefined' || targ === null) return src;

        // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
        for (const key of Object.keys(src)) {
            if (src[key] instanceof Object) Object.assign(src[key], recurse(targ[key], src[key]));
        }

        // Join `target` and modified `source`
        return Object.assign(targ || {}, src);
    };

    return recurse(target, source);
};

export function mergeObjectWithUpdater(orig: any, updater: any) {
    const newObj = JSON.parse(JSON.stringify(orig, getCircularReplacer()));
    const newObj2 = JSON.parse(JSON.stringify(newObj));
    const clonedNewObject = JSON.parse(JSON.stringify(updater));
    const changeLocs = findAllUids(newObj, updater.uid);
    changeLocs.forEach(([loc, path]) => {
        deepMerge(loc, clonedNewObject);
        // console.log('subId', JSON.parse(JSON.stringify(subResults[subId])));
        augmentStubs(loc, newObj2);
    });
    return newObj;
}

export function findUid(object: any, uid: string, path?: any[], seenPaths?: any[], seenObjects?: any[]) {
    const currentPath = [...(path || [])];
    if (object?.uid) {
        currentPath.push(object);
    }
    if (path?.map((el) => el.uid).includes(object?.uid)) {
        return [undefined, currentPath];
    }
    if (object?.uid === uid) return [object, currentPath];
    if (typeof object === 'object' && object) {
        if (Array.isArray(object)) {
            for (const el of object) {
                const result: any = findUid(el, uid, currentPath, seenPaths, seenObjects);
                if (result[0]) {
                    seenPaths?.push(result[1]);
                    seenObjects?.push(result[0]);
                }
            }
        } else {
            const keys = Object.keys(object);
            for (let i = 0; i < keys.length; i += 1) {
                const result: any = findUid(object[keys[i]], uid, currentPath, seenPaths, seenObjects);
                if (result[0]) {
                    seenPaths?.push(result[1]);
                    seenObjects?.push(result[0]);
                }
            }
        }
    }
    return [undefined, currentPath];
}

export function findAllUids(object: any, uid: string) {
    const allResults: any[] = [];
    const seenPaths: any[] = [];
    const seenObjects: any[] = [];
    findUid(object, uid, [], seenPaths, seenObjects);
    seenObjects.forEach((obj, index) => {
        if (obj !== undefined && obj !== null && obj.uid) {
            allResults.push([obj.uid, obj, seenPaths[index]]);
        }
    });
    return allResults.map((el) => [Object.assign(el[1], { uid: el[0] }), el[2]]);
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
            if (!keys.includes('uid') || object.uid === undefined || object.uid === null) {
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
                return value.uid ? { uid: value.uid } : undefined;
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
                // console.log('looking ', curr.uid, curr);
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
                    // console.log('applied ', curr.uid, { dict: uidDict[curr.uid], curr });
                    Object.assign(
                        curr,
                        JSON.parse(JSON.stringify(uidDict[curr.uid])),
                        JSON.parse(JSON.stringify(curr)),
                    );
                }
            }
        }
    }

    recurseOrig(origObj);
    recurseObj(objWithStubs);
    // console.log(uidDict);
}

function getObjectAsRecursivePrimitive(object: any, getRef?: boolean) {
    let targetValue: any;
    Object.keys(object).forEach((el) => {
        if (el.startsWith('_value.')) {
            targetValue = getRef ? object : object[el];
        } else if (el.startsWith('_value') && typeof object[el] === 'object') {
            const subObj = getObjectAsRecursivePrimitive(object[el], getRef);
            if (subObj || subObj === '' || subObj === 0 || subObj === false) targetValue = subObj;
        }
    });
    return targetValue;
}

function getObjectAsRecursiveSubentity(object: any, getRef?: boolean) {
    let targetValue: any;
    if (object?.type?.['unigraph.id'] === '$/schema/subentity' && object._value) {
        targetValue = getRef ? object : object._value;
    } else
        Object.keys(object).forEach((el) => {
            if (el === '_value' && typeof object[el] === 'object') {
                const subObj = getObjectAsRecursiveSubentity(object[el], getRef);
                if (subObj !== undefined) targetValue = subObj;
            }
        });
    return targetValue;
}

function getObjectAsRecursiveType(object: any, type: string) {
    let targetValue: any;
    if (object.type?.['unigraph.id'] === type) {
        targetValue = object;
    }
    Object.keys(object).forEach((el: any) => {
        if (el.type?.['unigraph.id'] === type) {
            targetValue = object[el];
        } else if (el.startsWith('_value') && typeof object[el] === 'object') {
            const subObj = getObjectAsRecursiveType(object[el], type);
            if (subObj || subObj === '' || subObj === 0 || subObj === false) targetValue = subObj;
        }
    });
    return targetValue;
}

export const getObjectAs = (object: any, type: 'primitive' | 'items' | string) => {
    if (type === 'primitive') {
        return getObjectAsRecursivePrimitive(object);
    }
    if (type === 'primitiveRef') {
        return getObjectAsRecursivePrimitive(object, true);
    }
    if (type === 'subentity') {
        return getObjectAsRecursiveSubentity(object);
    }
    if (type === 'subentityRef') {
        return getObjectAsRecursiveSubentity(object, true);
    }
    if (type === 'items' && object?.['_value[']) {
        return object['_value['].map((el: any) => el._value);
    }
    if (type?.startsWith('$/schema/')) {
        return getObjectAsRecursiveType(object, type);
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

    map = (fn: any) => {
        if (Array.isArray((this as any)?.['_value['])) {
            return (this as any)['_value['].map((el: any) => fn(new UnigraphObject(el)));
        }
        return undefined;
    };

    forEach = (fn: any) => {
        if (Array.isArray((this as any)?.['_value['])) {
            return (this as any)['_value['].forEach((el: any) => fn(new UnigraphObject(el)));
        }
        return undefined;
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
export function buildGraph(
    objects: UnigraphObject[],
    topLevelOnly?: boolean,
    onlyLookAtFirstN?: number,
): UnigraphObject[] {
    const objs: any[] = [...objects].map((el: any) => (Array.isArray(el) ? el : new UnigraphObject(el)));
    const dict: any = {};

    const seen = new WeakSet();
    function buildDictRecurse(obj: any, pastUids: any[] = []) {
        if (seen.has(obj)) return;
        if (typeof obj === 'object') seen.add(obj);
        if (obj && typeof obj === 'object' && Array.isArray(obj)) {
            Array.from(obj).forEach((value, index) => {
                if (value?.uid && !dict[value.uid]) dict[value.uid] = value;
                else if (value?.uid && Object.values(value).filter((el) => typeof el !== 'function').length > 1) {
                    // console.log(`assigning uid ${value.uid} with `, obj[index]);
                    Object.assign(dict[value.uid], obj[index]);
                }
                buildDictRecurse(value, [...pastUids, value?.uid]);
            });
        } else if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]: [key: string, value: any]) => {
                if (value?.uid && !dict[value.uid]) dict[value.uid] = value;
                else if (value?.uid && Object.values(value).filter((el) => typeof el !== 'function').length > 1) {
                    // console.log(`assigning uid ${value.uid} with `, obj[key]);
                    Object.assign(dict[value.uid], obj[key]);
                }
                buildDictRecurse(value, [...pastUids, value?.uid]);
            });
        }
    }

    const graphSeen = new WeakSet();
    function buildGraphRecurse(obj: any, pastUids: any[] = []) {
        if (typeof obj === 'object') graphSeen.add(obj);
        if (obj?.uid && dict[obj.uid]) {
            Object.assign(obj, dict[obj.uid]);
        }
        if (obj && typeof obj === 'object' && Array.isArray(obj)) {
            Array.from(obj).forEach((value, index) => {
                if (!graphSeen.has(value)) buildGraphRecurse(value, [...pastUids, value?.uid]);
            });
        } else if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]: [key: string, value: any]) => {
                if (!graphSeen.has(value)) buildGraphRecurse(value, [...pastUids, value?.uid]);
            });
        }
    }

    const startTime = new Date().getTime();

    objs.forEach((object) => {
        if (object?.uid && Object.values(object).filter((el) => typeof el !== 'function').length > 1)
            dict[object.uid] = object;
    });
    if (!topLevelOnly) objs.forEach((object) => buildDictRecurse(object));

    // console.log(dict);

    objs.filter((el, index) => (onlyLookAtFirstN ? index < onlyLookAtFirstN : true)).forEach((object) =>
        buildGraphRecurse(object),
    );

    const graphTime = new Date().getTime() - startTime;
    if (graphTime > 15) console.log(`Build graph took ${graphTime}ms, which is a bit slow`);

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

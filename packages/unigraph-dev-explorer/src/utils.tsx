/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
import stringify from 'json-stable-stringify';
import _ from 'lodash/fp';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { isJsonString, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';

export const NavigationContext = React.createContext<(location: string) => any>((location: string) => ({}));

export const trivialTypes = [
    '$/schema/markdown',
    '$/schema/subentity',
    '$/schema/interface/textual',
    '$/schema/person',
];

export function isValidHttpUrl(string: string) {
    let url;

    try {
        url = new URL(string);
    } catch (e) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
}

export const TabContext = React.createContext({
    viewId: 0,
    setTitle: (title: string, icon?: any, renamerId?: any) => {},
    setMaximize: (val: boolean) => {},
    isVisible: () => true as boolean,

    subscribeToType(name: any, callback: any, eventId?: any, options?: any) {
        return window.unigraph.subscribeToType(name, callback, eventId, options);
    },
    subscribeToObject(uid: any, callback: any, eventId?: any, options?: any) {
        window.unigraph.subscribeToObject(uid, callback, eventId, options);
    },
    subscribeToQuery(fragment: any, callback: any, eventId?: any, options?: any) {
        window.unigraph.subscribeToQuery(fragment, callback, eventId, options);
    },
    subscribe(query: any, callback: any, eventId?: any, update?: any) {
        window.unigraph.subscribe(query, callback, eventId, update);
    },
    unsubscribe(id: any) {
        window.unigraph.unsubscribe(id);
    },
});

export const isDeveloperMode = () => {
    return window.unigraph.getState('settings/developerMode').value;
};

export type DataContextType = {
    contextUid: string;
    contextData?: any;
    parents?: string[];
    viewType?: string;
    expandedChildren: boolean;
    subsId?: any;
    getParents: (withParents?: boolean) => string[];
};

export const DataContext = React.createContext<DataContextType>({
    contextUid: '0x0',
    contextData: {},
    parents: [],
    getParents: () => [],
    expandedChildren: false,
});

export const DataContextWrapper = ({
    children,
    contextUid,
    contextData,
    parents,
    viewType,
    expandedChildren,
    subsId,
}: any) => {
    const parentContext = React.useContext(DataContext);

    const dataContext = React.useMemo(() => {
        return {
            contextUid,
            contextData,
            viewType,
            parents,
            expandedChildren: !!expandedChildren,
            getParents: (withParents?: boolean) => {
                return [
                    ...parentContext.getParents(withParents),
                    ...(withParents ? parents || [] : []),
                    ...(expandedChildren ? [contextUid] : []),
                ];
            },
            subsId: subsId || parentContext.subsId,
        };
    }, [contextUid, contextData?.uid, viewType, expandedChildren, JSON.stringify(parents?.sort?.()), subsId]);

    return <DataContext.Provider value={dataContext}>{children}</DataContext.Provider>;
};

export const getComponentFromPage = (location: string, params: any = {}) => {
    const pages = window.unigraph.getState('registry/pages');
    console.log(params);
    if (location.startsWith('/$/'))
        location = `/${(window.unigraph.getNamespaceMap as any)()[location.substring(1)].uid}`;
    return {
        type: 'tab',
        config: params,
        icon: pages.value[location.slice(1)].icon || params.icon,
        name: pages.value[location.slice(1)].name,
        component: (location.startsWith('/') ? '/pages' : '/pages/') + location,
        enableFloat: 'true',
    };
};

export const setCaret = (document: Document, element: any, pos: number, length?: number) => {
    const maxLen = element.value.length < pos ? element.value.length : pos;
    element.setSelectionRange(maxLen, maxLen + (length || 0));
};

// export const getCaret = (ev: PointerEvent) => {
//     if (document.caretRangeFromPoint) {
//         return document.caretRangeFromPoint(ev.clientX, ev.clientY)?.startOffset;
//     }
//     console.log('getCaret', ev);
//     // return window.getSelection()?.anchorOffset;
//     return window.getSelection()?.anchorOffset;
// };

export const getCaret = (ev: PointerEvent) => {
    if (document.caretRangeFromPoint) {
        // if this function is defined
        return document.caretRangeFromPoint(ev.clientX, ev.clientY)?.startOffset;
    }
    // window.getSelection() can't ddetect line
    return window.getSelection()?.anchorOffset;
};

export function scrollIntoViewIfNeeded(target: Element) {
    if (target.getBoundingClientRect().bottom > window.innerHeight - 33) {
        target.scrollIntoView(false);
    }

    if (target.getBoundingClientRect().top < 0) {
        target.scrollIntoView();
    }
}

export const removeAllPropsFromObj = function (obj: any, propsToRemove: any, maxLevel?: any) {
    if (typeof maxLevel !== 'number') maxLevel = 100;
    for (const prop in obj) {
        if (typeof propsToRemove === 'string' && prop === propsToRemove) delete obj[prop];
        else if (propsToRemove.indexOf(prop) >= 0) {
            // it must be an array
            delete obj[prop];
        } else if (typeof obj[prop] === 'object' && maxLevel > 0) {
            removeAllPropsFromObj(obj[prop], propsToRemove, maxLevel - 1);
        }
    }
    return obj;
};

export function timeSince(ts: number | Date) {
    const current = new Date().getTime();
    const previous = typeof ts === 'number' ? ts : new Date(ts).getTime();
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return `${Math.round(elapsed / 1000)}s`;
    }

    if (elapsed < msPerHour) {
        return `${Math.round(elapsed / msPerMinute)}m`;
    }

    if (elapsed < msPerDay) {
        return `${Math.round(elapsed / msPerHour)}h`;
    }

    if (elapsed < msPerMonth) {
        return `${Math.round(elapsed / msPerDay)}d`;
    }

    if (elapsed < msPerYear) {
        return `${Math.round(elapsed / msPerMonth)}mo`;
    }

    return `${Math.round(elapsed / msPerYear)}y`;
}

export function getParameters(search: string) {
    // Params obj
    const params: any = {};
    // To lowercase
    // var url1 = search.substr(1);
    // To array
    const url = search.split('&');

    // Iterate over URL parameters array
    const { length } = url;
    for (let i = 0; i < length; i++) {
        // Create prop
        const prop = url[i].slice(0, url[i].search('='));
        // Create Val
        const value = url[i].slice(url[i].search('=')).replace('=', '');
        // Params New Attr
        params[prop] = value;
    }
    return params;
}

export function getContrast(hex: string) {
    // eslint-disable-next-line inclusive-language/use-inclusive-words -- link url
    /*
    From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast
    
    Color brightness is determined by the following formula: 
    ((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000

I know this could be more compact, but I think this is easier to read/explain.
    
    */

    const threshold = 160; /* about half of 256. Lower threshold equals more dark text on dark background  */

    const hRed = hexToR(hex);
    const hGreen = hexToG(hex);
    const hBlue = hexToB(hex);

    function hexToR(h: string) {
        return parseInt(cutHex(h).substring(0, 2), 16);
    }
    function hexToG(h: string) {
        return parseInt(cutHex(h).substring(2, 4), 16);
    }
    function hexToB(h: string) {
        return parseInt(cutHex(h).substring(4, 6), 16);
    }
    function cutHex(h: string) {
        return h.charAt(0) === '#' ? h.substring(1, 7) : h;
    }

    const cBrightness = (hRed * 299 + hGreen * 587 + hBlue * 114) / 1000;
    if (cBrightness > threshold) {
        return '#000000';
    }
    return '#ffffff';
}

export function download(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function upload(callback: any) {
    const element = document.createElement('input');
    element.setAttribute('type', 'file');
    element.onchange = (ev) => callback(element.files![0]);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

const makeCRCTable = function () {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
    }
    return crcTable;
};

export const crc32 = function (str: string) {
    const crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    let crc = 0 ^ -1;

    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
    }

    return (crc ^ -1) >>> 0;
};

export const crcStringify = function (thing: any) {
    return crc32(stringify(thing));
};

// Originally inspired by  David Walsh (https://davidwalsh.name/javascript-debounce-function)

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// `wait` milliseconds.
export const debounce = (func: any, wait: number) => {
    let timeout: any;
    let currentDelay: any;

    const executedFunction = function (...args: any[]) {
        const later = (isFlushing?: boolean) => {
            clearTimeout(timeout);
            func(...args, isFlushing);
        };

        currentDelay = later;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };

    executedFunction.cancel = () => {
        clearTimeout(timeout);
        currentDelay = null;
    };
    executedFunction.flush = () => {
        if (currentDelay) currentDelay(true);
    };

    return executedFunction;
};

type TreeNode = {
    uid: string;
    children: string[];
    root?: boolean;
    type?: string;
};
export const dfs = (nodes: TreeNode[]) => {
    const root = nodes.filter((el) => el.root)[0] || nodes[0];
    const nmap: Record<string, TreeNode> = Object.fromEntries(nodes.map((el) => [el.uid, el]));
    const traversal: TreeNode[] = [];

    const recurse = (current: TreeNode, visited: any[]) => {
        if (visited.includes(current?.uid)) return;
        if (current?.children) {
            // Ignores nodes referenced by but without uid
            traversal.push(current);
            current.children.forEach((el) => recurse(nmap[el], [...visited, current.uid]));
        } else if (current) {
            traversal.push(current);
        }
    };
    recurse(root, []);
    return traversal;
};

export const isElectron = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.indexOf(' electron/') > -1 && window.electronShell;
};

// Ref: https://stackoverflow.com/a/34064434
export function htmlDecode(input: string) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
}

/**
 * Whether this is a mobile device with touch capacity.
 * Not to be confused with isSmallScreen which checks width.
 */
export const isMobile = () =>
    'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;

/**
 * Whether the window is a small screen for layouting.
 * Not to be confused with isMobile which checks touch.
 */
export const isSmallScreen = () => window.innerWidth <= 720;

/**
 * Whether the window is a large screen for layouting.
 */
export const isLargeScreen = () => window.innerWidth >= 1500;

export const selectUid = (uid: string, exclusive = true) => {
    const selected = window.unigraph.getState('global/selected');
    const newUid = selected.value?.includes?.(uid)
        ? selected.value.filter((el: string) => el !== uid)
        : _.union(selected.value, [uid]);
    selected.setValue(exclusive ? [uid] : newUid, true);
};

export const deselectUid = (uid?: string) => {
    const selected = window.unigraph.getState('global/selected');
    selected.setValue(selected.value.filter((el: string) => (uid ? el !== uid : false)));
};

export const isMultiSelectKeyPressed = (event: React.MouseEvent) => event.altKey;

// TODO delete this and use the one in common
export const runClientExecutable = (src: string, params: any) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = eval('Object.getPrototypeOf(async function () {}).constructor');
    const fn = new AsyncFunction(
        'require',
        'unpad',
        'context',
        'unigraph',
        `try {${src}
    } catch (e) {
            unigraph.addNotification({
                from: "Executable manager", 
                name: "Failed to run executable",
                content: "Error was: " + e.toString() + e.stack }
            )
    }`,
    ).bind(this, require, unpad, { params }, window.unigraph);
    fn();
};

/**
 * Add notification badge (pill) to favicon in browser tab
 * @url stackoverflow.com/questions/65719387/
 */
export class Badger {
    canvas: HTMLCanvasElement;

    src: any;

    ctx: any;

    radius: any;

    offset: any;

    badgeSize: any;

    backgroundColor: any;

    color: any;

    size: any;

    position: any;

    _value!: number;

    onChange: any;

    img!: HTMLImageElement;

    faviconSize!: number;

    constructor(options: any) {
        Object.assign(
            this,
            {
                backgroundColor: '#0cf',
                color: '#fff',
                size: 1, // 0..1 (Scale in respect to the favicon image size)
                position: 'c', // Position inside favicon "n", "e", "s", "w", "ne", "nw", "se", "sw"
                radius: 16, // Border radius
                src: '', // Favicon source (dafaults to the <link> icon href)
                onChange() {},
            },
            options,
        );
        this.canvas = document.createElement('canvas');
        this.src = this.src || this.faviconEL?.getAttribute('href');
        this.ctx = this.canvas.getContext('2d');
    }

    faviconEL = document.querySelector('link[rel$=icon]');

    _drawIcon() {
        this.ctx.clearRect(0, 0, this.faviconSize, this.faviconSize);
        this.ctx.drawImage(this.img, 0, 0, this.faviconSize, this.faviconSize);
    }

    _drawShape() {
        const r = this.radius;
        const xa = this.offset.x;
        const ya = this.offset.y;
        const xb = this.offset.x + this.badgeSize;
        const yb = this.offset.y + this.badgeSize;
        this.ctx.beginPath();
        this.ctx.moveTo(xb - r, ya);
        this.ctx.quadraticCurveTo(xb, ya, xb, ya + r);
        this.ctx.lineTo(xb, yb - r);
        this.ctx.quadraticCurveTo(xb, yb, xb - r, yb);
        this.ctx.lineTo(xa + r, yb);
        this.ctx.quadraticCurveTo(xa, yb, xa, yb - r);
        this.ctx.lineTo(xa, ya + r);
        this.ctx.quadraticCurveTo(xa, ya, xa + r, ya);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fill();
        this.ctx.closePath();
    }

    _drawVal() {
        const margin = (this.badgeSize * 0.18) / 2;
        this.ctx.beginPath();
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.font = `bold ${this.badgeSize * 0.6}px Arial`;
        this.ctx.fillStyle = this.color;
        this.ctx.fillText(this.value, this.badgeSize / 2 + this.offset.x, this.badgeSize / 2 + this.offset.y + margin);
        this.ctx.closePath();
    }

    _drawFavicon() {
        this.faviconEL!.setAttribute('href', this.dataURL);
    }

    _draw() {
        this._drawIcon();
        if (this.value) this._drawShape();
        if (this.value) this._drawVal();
        this._drawFavicon();
    }

    _setup() {
        this.faviconSize = this.img.naturalWidth;
        this.badgeSize = this.faviconSize * this.size;
        this.canvas.width = this.faviconSize;
        this.canvas.height = this.faviconSize;
        const sd = this.faviconSize - this.badgeSize;
        const sd2 = sd / 2;
        this.offset = (
            {
                n: { x: sd2, y: 0 },
                e: { x: sd, y: sd2 },
                s: { x: sd2, y: sd },
                w: { x: 0, y: sd2 },
                nw: { x: 0, y: 0 },
                ne: { x: sd, y: 0 },
                sw: { x: 0, y: sd },
                se: { x: sd, y: sd },
                c: { x: sd2, y: sd2 },
            } as any
        )[this.position];
    }

    // Public functions / methods:

    update() {
        this._value = Math.min(999, parseInt(this._value as any, 10));
        if (this.img) {
            this._draw();
            if (this.onChange) this.onChange.call(this);
        } else {
            this.img = new Image();
            this.img.addEventListener('load', () => {
                this._setup();
                this._draw();
                if (this.onChange) this.onChange.call(this);
            });
            this.img.src = this.src;
        }
    }

    get dataURL() {
        return this.canvas.toDataURL();
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
        this.update();
    }
}

export function getParents(elem: any) {
    const parents: any[] = [];
    if (!elem) return parents;
    while (elem.parentNode && elem.parentNode.nodeName.toLowerCase() != 'body') {
        elem = elem.parentNode;
        if (!elem) return parents;
        if (elem.dataset?.component) {
            parents.push(elem.dataset?.component);
        }
    }
    return parents;
}

export function getDateAsUTC(input: any) {
    const date = new Date(input);
    const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utc;
}

export function typeHasDetailedView(type: string) {
    return Object.keys(window.unigraph.getState('registry/dynamicViewDetailed').value).includes(type);
}

export function typeHasDynamicView(type: string) {
    return Object.keys(window.unigraph.getState('registry/dynamicView').value).includes(type);
}

export const getOrInitLocalStorage = (key: string, defaultValue: any) => {
    if (!isJsonString(window.localStorage.getItem(key))) {
        window.localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
    }
    return JSON.parse(window.localStorage.getItem(key) || '');
};

export const hoverSx = {
    // sx styles (mui v5) for when hovering over components
    '&:hover': { backgroundColor: 'action.hover', borderRadius: '4px' },
    '&:active': { backgroundColor: 'action.selected' },
};
export const pointerHoverSx = { cursor: 'pointer', ...hoverSx };

export const contextMenuItemStyle = { paddingTop: '4px', paddingBottom: '4px' };
export const globalTheme = {
    palette: {
        primary: { main: '#212121' },
        secondary: { main: '#616161' },
    },
};

export const getName = (obj: UnigraphObject) => {
    return (obj?.get?.('name') || obj?.get?.('title') || obj?.get?.('text'))?.as?.('primitive');
};

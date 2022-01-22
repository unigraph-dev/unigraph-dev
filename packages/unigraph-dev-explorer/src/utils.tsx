/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
import stringify from 'json-stable-stringify';
import _ from 'lodash';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';

export const NavigationContext = React.createContext<(location: string) => any>((location: string) => ({}));

export const TabContext = React.createContext({
    viewId: 0,
    setTitle: (title: string) => {},
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

type DataContextType = {
    contextUid: string;
    contextData?: any;
    parents?: string[];
    viewType?: string;
    expandedChildren: boolean;
    getParents: (withParents?: boolean) => string[];
};

export const DataContext = React.createContext<DataContextType>({
    contextUid: '0x0',
    contextData: {},
    parents: undefined,
    getParents: () => [],
    expandedChildren: false,
});

export const DataContextWrapper = ({ children, contextUid, contextData, parents, viewType, expandedChildren }: any) => {
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
        };
    }, [contextUid, contextData, viewType, expandedChildren, JSON.stringify((parents || []).sort?.())]);

    return <DataContext.Provider value={dataContext}>{children}</DataContext.Provider>;
};

export const getComponentFromPage = (location: string, params: any = {}) => {
    const pages = window.unigraph.getState('registry/pages');
    if (location.startsWith('/$/'))
        location = `/${(window.unigraph.getNamespaceMap as any)()[location.substring(1)].uid}`;
    return {
        type: 'tab',
        config: params,
        name: pages.value[location.slice(1)].name,
        component: (location.startsWith('/') ? '/pages' : '/pages/') + location,
        enableFloat: 'true',
    };
};

export const setCaret = (document: Document, element: any, pos: number, length?: number) => {
    // console.log(element, pos, length);
    const range = document.createRange();
    const sel = document.getSelection();
    const maxLen = element.textContent.length < pos ? element.textContent.length : pos;
    range.setStart(element, maxLen);
    if (length) {
        range.setEnd(element, length + maxLen);
    } else {
        range.collapse(true);
    }

    sel?.removeAllRanges();
    sel?.addRange(range);
};

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

/**
 * Get the contrasting color for any hex color
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
 * @param  {String} hexcolor A hexcolor value
 * @return {String} The contrasting color (black or white)
 */
export const getContrast = function (hexcolor: string) {
    // If a leading # is provided, remove it
    if (hexcolor.slice(0, 1) === '#') {
        hexcolor = hexcolor.slice(1);
    }

    // If a three-character hexcode, make six-character
    if (hexcolor.length === 3) {
        hexcolor = hexcolor
            .split('')
            .map((hex) => hex + hex)
            .join('');
    }

    // Convert to RGB value
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    // Get YIQ ratio
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Check contrast
    return yiq >= 128 ? 'black' : 'white';
};

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

    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

type TreeNode = {
    uid: string;
    children: string[];
    root?: boolean;
    type?: string;
};
export const dfs = (nodes: TreeNode[]) => {
    const root = nodes.filter((el) => el.root)[0];
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

export const runClientExecutable = (src: string, params: any) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = Object.getPrototypeOf(async () => false).constructor;
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
        if (elem.id?.startsWith?.('object-view-')) parents.push(elem.id.slice(12));
    }
    return parents;
}

export function getDateAsUTC(input: any) {
    const date = new Date(input);
    const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utc;
}

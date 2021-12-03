import stringify from 'json-stable-stringify';
import _ from 'lodash';
import React from 'react';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';

export const NavigationContext = React.createContext((location: string) => {});

export const TabContext = React.createContext({
    viewId: 0,
    setTitle: (title: string) => {},
    isVisible: () => true as boolean,
})
export const DataContext = React.createContext({
    rootUid: "0x0"
})

export const removeAllPropsFromObj = function(obj: any, propsToRemove: any, maxLevel?: any) {
    if (typeof maxLevel !== "number") maxLevel = 20
    for (var prop in obj) {
        if (typeof propsToRemove === "string" && prop === propsToRemove)
            delete obj[prop];
        else if (propsToRemove.indexOf(prop) >= 0)      // it must be an array
            delete obj[prop];
        else if (typeof obj[prop] === "object" && maxLevel>0)
            removeAllPropsFromObj(obj[prop], propsToRemove, maxLevel-1);
    }
    return obj
}

export function getParameters(search: string) {
    // Params obj
    var params: any = {};
    // To lowercase
    //var url1 = search.substr(1);
    // To array
    var url = search.split('&');

    // Iterate over URL parameters array
    var length = url.length;
    for(var i=0; i<length; i++) {
        // Create prop
        var prop = url[i].slice(0, url[i].search('='));
        // Create Val
        var value = url[i].slice(url[i].search('=')).replace('=', '');
        // Params New Attr
        params[prop] = value;
    }
    return params;
};

/**
 * Get the contrasting color for any hex color
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
 * @param  {String} hexcolor A hexcolor value
 * @return {String} The contrasting color (black or white)
 */
export const getContrast = function (hexcolor: string){

	// If a leading # is provided, remove it
	if (hexcolor.slice(0, 1) === '#') {
		hexcolor = hexcolor.slice(1);
	}

	// If a three-character hexcode, make six-character
	if (hexcolor.length === 3) {
		hexcolor = hexcolor.split('').map(function (hex) {
			return hex + hex;
		}).join('');
	}

	// Convert to RGB value
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);

	// Get YIQ ratio
	var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

	// Check contrast
	return (yiq >= 128) ? 'black' : 'white';

};

export function download(filename: string, text: string) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function upload(callback: any) {
    var element = document.createElement('input');
    element.setAttribute('type', 'file');
    element.onchange = (ev) => callback(element.files![0])

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function isTouchDevice() {
    return (('ontouchstart' in window) ||
       (navigator.maxTouchPoints > 0) ||
       (navigator.msMaxTouchPoints > 0));
  }

const makeCRCTable = function(){
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

export const crc32 = function(str: string) {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ (-1);

    for (var i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
};

export const crcStringify = function(thing: any) { return crc32(stringify(thing)); }

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

type TreeNode = {uid: string, children: string[], root?: boolean};
export const dfs = (nodes: TreeNode[]) => {
    const root = nodes.filter(el => el.root)[0];
    const nmap: Record<string, TreeNode> = Object.fromEntries(nodes.map(el => [el.uid, el]));
    let traversal: TreeNode[] = [];

    const recurse = (current: TreeNode) => {
        if (current?.children) { // Ignores nodes referenced by but without uid
            traversal.push(current);
            current.children.forEach(el => recurse(nmap[el]));
        } else if (current) {
            traversal.push(current);
        }
    }
    recurse(root);
    return traversal;
}

export const isElectron = () => {
    let userAgent = navigator.userAgent.toLowerCase();
    return (userAgent.indexOf(' electron/') > -1 && window.electronShell);
}

/**
 * Whether this is a mobile device with touch capacity.
 * Not to be confused with isSmallScreen which checks width. 
 */
export const isMobile = () => {
    return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
}

/**
 * Whether the window is a small screen for layouting. 
 * Not to be confused with isMobile which checks touch.
 */
export const isSmallScreen = () => {
    return window.innerWidth <= 720;
}

export const openUrl = (url: string) => {
    if (isElectron()) {
        window.electronShell.openExternal(url);
    } else {
        window.open(url, "_blank")
    }
}

export const selectUid = (uid: string, exclusive = true) => {
    const selected = window.unigraph.getState('global/selected');
    selected.setValue(exclusive ? [uid] : selected.value?.includes?.(uid) ? selected.value.filter((el: string) => el !== uid): _.union(selected.value, [uid]));
}

export const deselectUid = (uid?: string) => {
    const selected = window.unigraph.getState('global/selected');
    selected.setValue(selected.value.filter((el: string) => uid ? el !== uid : false))
}

export const isMultiSelectKeyPressed = (event: React.MouseEvent) => {
    return event.altKey;
}

export const runClientExecutable = (src: string, params: any) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const fn = new AsyncFunction("require", "unpad", "context", "unigraph", `try {${src}
    } catch (e) {
            unigraph.addNotification({
                from: "Executable manager", 
                name: "Failed to run executable",
                content: "Error was: " + e.toString() + e.stack }
            )
    }`).bind(this, require, unpad, {params}, window.unigraph);
    fn();
}
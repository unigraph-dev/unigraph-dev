import stringify from 'json-stable-stringify';
import React from 'react';

export const NavigationContext = React.createContext((location: string) => {});

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

/*!
 * Get the contrasting color for any hex color
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
 * @param  {String} A hexcolor value
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
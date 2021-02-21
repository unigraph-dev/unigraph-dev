import React from 'react';

export const NavigationContext = React.createContext((location: string) => {});

export function getParameters(search: string) {
    // Params obj
    var params: any = {};
    // To lowercase
    var url1 = search.substr(1);
    // To array
    var url = url1.split('&');

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
export const typeMap: Record<string, string> = {
    object: '_value',
    number: '_value.#i',
    bigint: '_value.#i',
    undefined: '_value',
    null: '_value',
    boolean: '_value.!',
    string: '_value.%',
    datetime: '_value.%dt',
    function: '_value',
    symbol: '_value',
};

export const typeMapUnigraph: Record<string, string> = {
    '$/primitive/number': '_value.#',
    '$/primitive/boolean': '_value.!',
    '$/primitive/string': '_value.%',
};

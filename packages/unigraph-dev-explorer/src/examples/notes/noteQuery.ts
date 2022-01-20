const MAX_DEPTH = 8;
const getQuery: (depth: number) => string = (depth: number) => {
    if (depth >= MAX_DEPTH) return '{ uid _hide type {<unigraph.id>} }';
    return `{
        _updatedAt
        uid
        _hide
        <~_value> {
            type { <unigraph.id> }
            <unigraph.origin> @filter(NOT eq(_hide, true)) {
                type { <unigraph.id> }
                uid
            }
        }
        <unigraph.origin> @filter(NOT eq(_hide, true)) {
            type { <unigraph.id> }
            uid
        }
        type {
            <unigraph.id>
        }
        _value {
            uid
            text {
                uid
                _value {
                    _value {
                        <dgraph.type>
                        uid type { <unigraph.id> }
                        <_value.%>
                    }
                    uid type { <unigraph.id> }
                }
            }
            children {
                uid
                <_value[> {
                    uid
                    <_index> { uid <_value.#i> }
                    <_key>
                    <_value> {
                        _hide
                        _value ${getQuery(depth + 1)}
                        uid
                        type { <unigraph.id> }
                    }
                }
            }
        }
    }`;
};

export const noteQueryDetailed = (uid: string, depth = 0) => `(func: uid(${uid})) ${getQuery(depth + 1)}`;
export const journalQueryDetailed = (uid: string, depth = 0) => `(func: uid(${uid})) {
    _updatedAt
    uid
    _hide
    type {
        <unigraph.id>
    }
    _value {
        note {
            _value ${getQuery(depth + 1)}
        }
    }
}`;

export const noteQuery = (uid: string) => `(func: uid(${uid})) ${getQuery(MAX_DEPTH - 1)}`;
export const journalQuery = (uid: string) => `(func: uid(${uid})) {
    _updatedAt
    uid
    _hide
    type {
        <unigraph.id>
    }
    _value {
        note {
            _value ${getQuery(MAX_DEPTH - 1)}
        }
    }
}`;

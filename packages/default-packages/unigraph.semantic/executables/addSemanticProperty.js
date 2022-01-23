const sourceUid = context.params.tag;
const destUid = context.params.where;

// TODO: This is very unsafe - get unified sanitized input function
const queryDest = `(func: uid(${destUid})) {
    type {
        <unigraph.id>
    }
    _value {
        children {
            uid
            <_value[> {
                _index { <_value.#i> }
            }
        }
    }
}`;

const querySource = `(func: uid(${sourceUid})) {
    type {
        <unigraph.id>
    }
}`;

const results = await unigraph.getQueries([querySource, queryDest]);

// Check for schema accordance
if (
    results[0].length !== 1 ||
    results[1].length !== 1 ||
    !results[0][0].type ||
    results[0][0].type['unigraph.id'] !== '$/schema/tag' ||
    !results[1][0].type ||
    results[1][0].type['unigraph.id'] !== '$/schema/semantic_properties'
) {
    throw new Error('Wrong schema - are you sure you are supplying the correct (should have Entity type) uids?');
}

const childrenUid = results[1][0]._value.children.uid;
const children = results[1][0]._value.children['_value['];

await unigraph.updateObject(
    childrenUid,
    {
        '_value[': {
            _index: { '_value.#i': children.length },
            _value: {
                uid: sourceUid,
            },
        },
    },
    true,
    false,
);

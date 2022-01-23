const { uid } = context.params;
const obj = await unigraph.getQueries(`(func: uid(${uid})) {
    unigraph.indexes {
        uid
        name { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
          uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
    }
    _value {
        name { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
          uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
    }
}`);
const name =
    new UnigraphObject(obj[0][0]['unigraph.indexes']?.name || obj[0][0]._value?.name || {}).as?.('primitive') || uid;
console.log(JSON.stringify(obj[0][0], null, 4));
unigraph.addObject(
    {
        name: { type: { 'unigraph.id': '$/schema/markdown' }, _value: `Follow up: [[${name}]]` },
        done: false,
        priority: 0,
        children: [
            {
                type: {
                    'unigraph.id': '$/schema/interface/semantic',
                },
                $parentcontext: {
                    _key: `[[${name}]]`,
                },
                _value: { uid },
            },
        ],
    },
    '$/schema/todo',
);

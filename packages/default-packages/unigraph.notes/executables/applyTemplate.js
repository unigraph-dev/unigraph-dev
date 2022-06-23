const { uid, templateUid, subsId } = context.params;

const templateObj = await unigraph.getObject(templateUid);
buildGraph([templateObj]);

const applyTemplateRecursive = (_obj, isTop = true) => {
    const obj = new UnigraphObject(_obj);
    let templated;
    if (obj.getType() === '$/schema/note_block') {
        templated = {
            text: {
                type: { 'unigraph.id': '$/schema/markdown' },
                _value: obj.get('text')?.as('primitive') || '',
            },
        };
    } else if (
        obj.getType() === '$/schema/embed_block' &&
        obj.get('content')._value.type?.['unigraph.id'] === '$/schema/todo'
    ) {
        const td = new UnigraphObject(obj.get('content')._value);
        templated = {
            content: {
                type: { 'unigraph.id': '$/schema/todo' },
                name: {
                    type: { 'unigraph.id': '$/schema/markdown' },
                    _value: td.get('name')?.as('primitive') || '',
                },
                done: false,
                priority: td.get('priority')?.as('primitive'),
                children: (td.get('children')?.['_value['] || [])
                    .sort((a, b) => a._index?.['_value.#i'] - b._index?.['_value.#i'])
                    .map((el, idx) => {
                        const child = el._value;
                        if (child.type?.['unigraph.id'] === '$/schema/interface/semantic') {
                            return {
                                $parentcontext: {
                                    _key: el._key,
                                    ...(isTop
                                        ? {}
                                        : {
                                              _index: {
                                                  '_value.#i': idx,
                                              },
                                          }),
                                },
                                type: { 'unigraph.id': '$/schema/interface/semantic' },
                                _value: {
                                    uid: child._value.uid,
                                },
                            };
                        }
                        return undefined;
                    })
                    .filter(Boolean),
            },
        };
    }
    const children = (obj.get('children')?.['_value['] || [])
        .sort((a, b) => a._index?.['_value.#i'] - b._index?.['_value.#i'])
        .map((el, idx) => {
            const child = el._value;
            if (child.type?.['unigraph.id'] === '$/schema/interface/semantic') {
                return {
                    $parentcontext: {
                        _key: el._key,
                        ...(isTop
                            ? {}
                            : {
                                  _index: {
                                      '_value.#i': idx,
                                  },
                              }),
                    },
                    type: { 'unigraph.id': '$/schema/interface/semantic' },
                    _value: {
                        uid: child._value.uid,
                    },
                };
            }
            return {
                ...(isTop
                    ? {}
                    : {
                          $parentcontext: {
                              _index: {
                                  '_value.#i': idx,
                              },
                          },
                      }),
                type: { 'unigraph.id': child.type?.['unigraph.id'] },
                _value: {
                    type: { 'unigraph.id': child._value?.type?.['unigraph.id'] },
                    _value: applyTemplateRecursive(child._value, false),
                },
            };
        });
    return {
        $context: {
            _hide: obj._hide,
        },
        ...templated,
        children: {
            $context: {
                _displayAs: obj.get('children')?._displayAs,
            },
            _value: children,
        },
    };
};

const res = applyTemplateRecursive(templateObj);

// console.log(res);

if (uid) await unigraph.addObject({ children: res.children, uid }, '$/schema/note_block', undefined, subsId);
else return res;

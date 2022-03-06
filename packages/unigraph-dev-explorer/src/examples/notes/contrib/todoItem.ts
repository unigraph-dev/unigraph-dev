import { getRandomId, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { parseTodoObject } from '../../todo/parseTodoObject';

// TODO(Sophia): Move this to type declaration of Todo!

const wrapTagRef = (name: string) => {
    const tagRefId = getRandomId();
    return {
        _value: {
            type: {
                $ref: {
                    query: [{ key: 'unigraph.id', value: '$/schema/interface/semantic' }],
                },
            },
            'dgraph.type': 'Interface',
            _value: {
                type: {
                    $ref: {
                        query: [{ key: 'unigraph.id', value: '$/schema/tag' }],
                    },
                },
                'dgraph.type': 'Entity',
                _value: {
                    name: {
                        '_value.%': name,
                        uid: `_:link0${tagRefId}`,
                    },
                },
                _updatedAt: new Date().toISOString(),
                'unigraph.indexes': {
                    name: { uid: `_:link0${tagRefId}` },
                },
                $ref: {
                    query: [
                        { key: 'name', value: name },
                        { key: 'type/unigraph.id', value: '$/schema/tag' },
                    ],
                },
            },
            _updatedAt: new Date().toISOString(),
            'unigraph.indexes': {},
        },
    };
};

const editorPlugin = {
    type: '$/schema/todo',
    pullText: (data: any, uid?: boolean) => {
        if (uid) return data?._value?.name?._value?._value?.uid;
        const tags = (data._value?.children?.['_value['] || [])
            .filter((el: any) => el?._value?._value?.type?.['unigraph.id'] === '$/schema/tag')
            .map((tag: any) => `#${tag?._value?._value?._value?.name?.['_value.%']}`);
        const name = new UnigraphObject(data).get('name')?.as('primitive');
        return name === undefined
            ? undefined
            : `${name}${tags.length ? ` ${tags.join(' ')}` : ''}${name.trim().length ? '' : ' '}`;
    },
    pushText: (subsId: any, data: any, text: string, isFlushing?: boolean) => {
        // console.log(data);
        const todoObject = parseTodoObject(text);
        const totalTags = todoObject.children
            .map((el: any) => (el._value.type['unigraph.id'] === '$/schema/tag' ? el._value.name : undefined))
            .filter(Boolean);
        const totalChildren = [
            ...totalTags.map((tag: string) => wrapTagRef(tag)),
            ...(data._value?.children?.['_value['] || [])
                .filter((el: any) => el?._value?._value?.type?.['unigraph.id'] !== '$/schema/tag')
                .map((el: any) => ({ uid: el.uid })),
        ];
        const newObject = {
            name: {
                uid: data._value.name.uid,
                _value: {
                    uid: data._value.name._value.uid,
                    _value: {
                        uid: data._value.name._value._value.uid,
                        '_value.%': todoObject.name._value,
                    },
                },
            },
            ...(isFlushing
                ? {
                      children: {
                          '_value[': totalChildren,
                      },
                  }
                : {}),
        };
        // console.log(newObject);
        return window.unigraph.updateObject(data._value.uid, newObject, false, false, subsId, []);
    },
};

export default editorPlugin;

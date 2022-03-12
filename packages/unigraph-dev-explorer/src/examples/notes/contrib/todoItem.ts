import { buildUnigraphEntity } from 'unigraph-dev-common/lib/utils/entityUtils';
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
        const things = (data._value?.children?.['_value['] || [])
            .filter((el: any) => el?._value?._value?.type?.['unigraph.id'] === '$/schema/tag')
            .map((tag: any) => `#${tag?._value?._value?._value?.name?.['_value.%']}`);
        const priority = data._value?.priority?.['_value.%'];
        if (priority) things.push(`!${priority}`);
        const timeFrame = new UnigraphObject(data).get('time_frame');
        if (timeFrame)
            things.push(
                `@"${new Date(timeFrame.get('start/datetime')?.as('primitive') || 0).toLocaleString()}"-"${new Date(
                    timeFrame.get('end/datetime')?.as('primitive') || 0,
                ).toLocaleString()}"`,
            );
        const name = new UnigraphObject(data).get('name')?.as('primitive');
        return name === undefined
            ? undefined
            : `${name}${things.length ? ` ${things.join(' ')}` : ''}${name.trim().length ? '' : ' '}`;
    },
    pushText: (subsId: any, data: any, text: string, isFlushing?: boolean) => {
        // console.log(data);
        const schemas = (window.unigraph as any).getSchemaMap();
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
        let tf;
        try {
            if (todoObject.time_frame)
                tf = buildUnigraphEntity(
                    JSON.parse(JSON.stringify(todoObject.time_frame)),
                    '$/schema/time_frame',
                    schemas,
                );
            else if (data._value.time_frame.uid) {
                window.unigraph.updateTriplets([`<${data._value.uid}> <time_frame> * .`], true);
                window.unigraph.deleteObject(data._value.time_frame._value.uid, true);
            }
        } catch (e) {
            // pass
            // console.log(todoObject.time_frame);
        }
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
            priority: {
                '_value.#i': todoObject.priority,
            },
            ...(tf
                ? {
                      time_frame: {
                          _propertyType: 'inheritance',
                          _value: tf,
                      },
                  }
                : {}),
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

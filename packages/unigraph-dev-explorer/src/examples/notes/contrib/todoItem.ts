import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';

// TODO(Sophia): Move this to type declaration of Todo!

const editorPlugin = {
    type: '$/schema/todo',
    pullText: (data: any) => {
        const tags = (data._value?.children?.['_value['] || [])
            .filter((el: any) => el?._value?._value?.type?.['unigraph.id'] === '$/schema/tag')
            .map((tag: any) => `#${tag}`);
        return `${new UnigraphObject(data).get('name')?.as('primitive')} ${tags.join(' ')}`;
    },
    pushText: (subsId: any, data: any, text: string) => {
        console.log(data);
        return window.unigraph.updateObject(
            new UnigraphObject(data).get('name')._value._value.uid,
            {
                '_value.%': text,
            },
            false,
            false,
            subsId,
            [],
        );
    },
};

export default editorPlugin;

export type SimpleClipboardItem = {
    uid?: string;
    content: any;
    children: SimpleClipboardItem[];
};

const generateHtmlChildren = (item: SimpleClipboardItem): string => {
    return `<li class="unigraph-child">${item.content}<ul>${item.children
        .map(generateHtmlChildren)
        .join('')}</ul></li>`;
};

const generateOutlinerChildren = (item: SimpleClipboardItem): string[] => {
    return [
        `- ${item.content}`,
        ...item.children
            .map(generateOutlinerChildren)
            .flat()
            .map((el) => `  ${el}`),
    ];
};

export const formatSimpleClipboardItems = (items: SimpleClipboardItem[]) => {
    // console.log(items);
    return {
        'text/html': `<ul>${items
            .map(
                (el) =>
                    `<li id="${el.uid}" class="unigraph-entity">${el.content}<ul>${el.children
                        .map(generateHtmlChildren)
                        .join('')}</ul></li>`,
            )
            .join('')}</ul>`,
        'text/plain': `${items
            .map(
                (el) =>
                    `- ${el.content}\n${el.children
                        .map(generateOutlinerChildren)
                        .flat()
                        .map((ell) => `  ${ell}\n`)
                        .join('')}`,
            )
            .join('')}`,
    };
};

export const parseUnigraphHtml = (html: string) => {
    const parser = new DOMParser();
    const htmldoc = parser.parseFromString(html, 'text/html');
    return htmldoc.body.children?.[0]?.children?.[0]?.className === 'unigraph-entity' ? htmldoc : null;
};

export const setClipboardHandler = (evv: ClipboardEvent) => {
    if (window.unigraph.getState('temp/clipboardItems').value?.length > 0) {
        const clip = formatSimpleClipboardItems(
            window.unigraph.getState('temp/clipboardItems').value.sort((a: any, b: any) => a.index - b.index),
        );
        evv.clipboardData?.setData('text/html', clip['text/html']);
        evv.clipboardData?.setData('text/plain', clip['text/plain']);
        window.unigraph.getState('temp/clipboardItems').setValue([]);
    }
};

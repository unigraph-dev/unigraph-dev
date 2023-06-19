const { uids, typeName, objects } = context.params;

const templates = {
    '$/schema/tweet': (data) => `Tweet: ${data._value.text._value._value['_value.%']}
From: ${data._value.from_user._value._value.name['_value.%']} (${data._value.from_user._value._value.description._value._value['_value.%']})`,
    '$/schema/reddit_post': (data) => `Reddit post: ${data._value.name._value._value['_value.%']}
${data._value.selftext._value._value['_value.%']}
Subreddit: r/${data._value.subreddit._value._value.name['_value.%']}
Subreddit description: ${data.get('subreddit/description')?.as('primitive')}`,
    '$/schema/web_bookmark': (data) => `Title: ${data.get('name')?.as('primitive')}
Abstract: ${data.get('creative_work/abstract')?.as('primitive')}
Content: ${data.get('creative_work/text')?.as('primitive')}`,
    '$/schema/youtube_video': (data) => `YouTube video: ${data.get('title')?.as('primitive')}
Description: ${data.get('description')?.as('primitive')}
Channel: ${data.get('channel/name')?.as('primitive')}`,
    '$/schema/email_message': (data) => {
        const { Readability } = require('@mozilla/readability');
        const { JSDOM } = require('jsdom');
        const textHtml = data.get('content/text')?.as('primitive');
        let text;
        try {
            const doc = new JSDOM(textHtml);
            text = doc.window.document.body?.textContent || data.get('content/abstract')?.as('primitive');
        } catch (e) {
            console.log('[caught.....]');
            text = textHtml;
        }
        return `Email Title: ${data.get('name')?.as('primitive')}
From: ${
            data.get('message/sender')?.['_value[']?.[0]?._value?.person?._value?._value?.['unigraph.indexes']?.name?.[
                '_value.%'
            ] ||
            data
                .get('message/sender')
                ?.['_value[']?.[0]?._value?.person?._value?._value?.['_value.%']?.split('<')
                .slice(0, -1)
                .join('')
                .trim()
        } <${data.get('message/sender')?.['_value[']?.[0]?._value.identifier?.['_value.%']}>
To: ${
            data.get('message/recipient')?.['_value[']?.[0]?._value?.person?._value?._value?.['unigraph.indexes']
                ?.name?.['_value.%'] ||
            data
                .get('message/recipient')
                ?.['_value[']?.[0]?._value?.person?._value?._value?.['_value.%']?.split('<')
                .slice(0, -1)
                .join('')
                .trim() ||
            ''
        } <${data.get('message/recipient')?.['_value[']?.[0]?._value.identifier?.['_value.%']}>
At: ${new Date(data._createdAt).toLocaleString()}
${text}`;
    },
    '$/schema/rss_item': (data) => {
        const { Readability } = require('@mozilla/readability');
        const { JSDOM } = require('jsdom');
        const textHtml =
            data.get('item_data/creative_work/text')?.as('primitive') || data.get('content/text')?.as('primitive');
        const doc = new JSDOM(textHtml);
        const text =
            new Readability(doc.window.document).parse()?.textContent || data.get('content/abstract')?.as('primitive');
        return `RSS article title: ${data.get('item_data/name')?.as('primitive')}
Feed: ${data.get('feed/site_info/name')?.as('primitive')}
${text}`;
    },
    '$/schema/tag': (data) =>
        `Tag: ${data.get('name')?.as('primitive')}, description: ${new UnigraphObject(data)
            .get('description')
            ?.as('primitive')}`,
    '$/schema/todo': (data) => {
        const name = data.get('name')?.as('primitive');
        const tags = (data.get('children')?.['_value['] || [])
            .filter(
                (el) =>
                    el?._value?.type?.['unigraph.id'] === '$/schema/interface/semantic' &&
                    el?._value?._value?.type?.['unigraph.id'] === '$/schema/tag',
            )
            .map((el) => new UnigraphObject(el._value._value).get('name')?.as('primitive'))
            .filter((el) => el?.length)
            .map((el) => `#${el}`);
        return `Todo item: [${data.get('done')?.as('primitive') ? 'x' : ' '}] ${name}${
            tags.length ? `\nTags: ${tags.join(', ')}` : ``
        }`;
    },
    '$/schema/text_message': async (data) => {
        const fromName =
            data.get('message/sender').as('items')[0].person?._value?._value?._value?.name['_value.%'] ||
            data.get('message/sender').as('items')[0].identifier['_value.%'].slice(1, -1);
        const thread = await unigraph.getQueries([
            `(func: uid(${data.uid})) { <unigraph.origin> @filter(uid_in(type, $unigraph.id{$/schema/text_thread})) { uid _value { participants { <_value[> { uid _value { uid _value { <_value.%> <unigraph.indexes> { name { <_value.%> } } } } }  } } } }`,
        ]);
        const participants = thread[0][0]?.['unigraph.origin']?.[0]._value.participants?.['_value[']
            .map(
                (el) =>
                    el._value?._value?.['unigraph.indexes']?.name?.['_value.%'] ||
                    el._value?._value?.['_value.%'].slice(1, -1),
            )
            .filter((el) => el !== fromName);
        return (
            `Text message from: ${fromName}\n` +
            `To: ${(participants || []).join(',')}\n` +
            `At: ${new Date(data._createdAt).toLocaleString()}\n` +
            `content:\n${data.get('content').as('primitive')}`
        );
    },
    '$/schema/executable': async (data) => {
        return (
            `[Internal] Executable code: ${data.get('name')?.as('primitive') || 'untitled'}\n` +
            `\`\`\`\n${data.get('src')?.as('primitive')}\n\`\`\``
        );
    },
    '$/schema/note_block': async (data) => {
        const MAX_DEPTH = 16;

        function parsePostProcess(parsed, replaced) {
            let maxHeading = 1;
            parsed.forEach((el) => {
                if (el.heading > maxHeading) maxHeading = el.heading;
            });
            return parsed
                .map((el) => {
                    let finText = el.text.replace(/\n/g, `\n${'  '.repeat(el.heading - 1)}`);
                    let hasMatch = true;
                    while (hasMatch) {
                        hasMatch = false;
                        const matches = replaced
                            .map((el) => `[[${el.from}]]`)
                            .map((str, idx) => [replaced[idx], finText.indexOf(str) !== -1]);
                        // console.log(matches);
                        matches.forEach(([match, hasMatch]) => {
                            if (!hasMatch) return;
                            hasMatch = true;
                            finText = finText.replace(`[[${match.from}]]`, `[[${match.to}|${match.from}]]`);
                        });
                    }
                    return el.heading === 1
                        ? ''
                        : !el.text.startsWith('```unigraph\n')
                        ? `${'  '.repeat(el.heading - 2)}${el.asOutline ? '* ' : ''}${finText}`
                        : finText;
                })
                .join('\n');
        }

        function parseNotePage(note, parsedLists) {
            const parsedList = [];

            function parseNoteToMarkdown(note, heading = 1, parsed = [], asOutline = true) {
                const name = note.get('text')?.as('primitive') || '';
                // if (note.getType() !== '$/schema/note_block') console.log(note);
                parsed.push({
                    text:
                        note.getType() === '$/schema/note_block'
                            ? name
                            : note?._value?.content?._value?.['unigraph.indexes']?.name
                            ? new UnigraphObject(note?._value.content._value['unigraph.indexes'].name).as('primitive')
                            : '',
                    heading,
                    asOutline,
                });
                (note.get('children')?.['_value['] || [])
                    .sort((a, b) => a?._index?.['_value.#i'] - b?._index?.['_value.#i'])
                    .map((child) => {
                        if (child?._value?.type?.['unigraph.id'] === '$/schema/subentity') {
                            // console.log(note, child);
                            const childNote = new UnigraphObject(child?._value?._value);
                            parseNoteToMarkdown(
                                childNote,
                                asOutline ? heading + 1 : heading,
                                parsed,
                                note.get('children')?._displayAs !== 'paragraph',
                            );
                        }
                    });
            }

            parseNoteToMarkdown(note, 1, parsedList);
            parsedLists.push(parsedList);
        }

        function parseNotesAsLists(notes) {
            const lists = [];
            notes.forEach((el) => parseNotePage(el, lists));

            return lists;
        }

        const getQuery = (depth) => {
            if (depth >= MAX_DEPTH) return '{ uid _hide type {uid <unigraph.id>} }';
            return `{
                _updatedAt
                uid
                _hide
                type {
                    uid
                    <unigraph.id>
                }
                _value {
                    uid
                    text {
                        uid
                        _value {
                            _value {
                                <dgraph.type>
                                uid type { uid <unigraph.id> }
                                <_value.%>
                            }
                            uid type { uid <unigraph.id> }
                        }
                    }
                    name {
                        <_value.%>
                    }
                    content {
                        uid
                        _value {
                            uid
                            type { uid <unigraph.id> }
                            <unigraph.indexes> {
                                name {
                                    <_value.%>
                                    _value { _value { <_value.%> } }
                                }
                            }
                        }
                    }
                    children {
                        uid
                        <_displayAs>
                        <_value[> {
                            uid
                            <_index> { uid <_value.#i> }
                            <_key>
                            <_value> @filter(uid_in(type, $unigraph.id{$/schema/subentity})) {
                                _hide
                                _value ${getQuery(depth + 1)}
                                uid
                                type { uid <unigraph.id> }
                            }
                            <_value> @filter(uid_in(type, $unigraph.id{$/schema/interface/semantic})) {
                                _hide
                                _value { uid type { uid <unigraph.id> } _stub: math(1) _value {
                                    name { <_value.%> }
                                }}
                                uid
                                type { uid <unigraph.id> }
                            }
                        }
                    }
                }
            }`;
        };
        const noteQueryDetailed = (depth = 0) => `${getQuery(depth + 1)}`;

        const noteQuery = `12(func: uid(${data.uid})) @filter(type(Entity)) ${noteQueryDetailed()}`;
        const note = (await unigraph.getQueries([noteQuery], false))[0]?.[0];
        if (!note) return undefined;

        const obj = new UnigraphObject(note);
        const pages = parseNotesAsLists([obj]);
        mkd = pages[0];
        const text = parsePostProcess(mkd, []);
        const title = obj.get('text')?.as('primitive') || '';
        // remove images
        const finalText = text.replace(/\!\[[^\[\]]*\]\([^\(\)]*\) ?/g, '');
        const finalTitle = title.replace(/\!\[[^\[\]]*\]\([^\(\)]*\) ?/g, '');
        return `Note: ${finalTitle}
Updated at: ${new Date(data._updatedAt).toLocaleString()}
Contents in Markdown:${finalText}`;
    },
};

const customQueryType = ['$/schema/note_block', '$/schema/calendar_event'];

let data = objects;

if (uids && typeName && !objects) {
    if (customQueryType.includes(typeName)) {
        data = uids.map((el) => ({ uid: el }));
    } else {
        data = await unigraph.getObject(uids, { queryAsType: typeName });
    }
}

if (!data) return;
let ret;

if (Array.isArray(data)) {
    ret = await Promise.all(
        data.map(async (obj) => ({ uid: obj.uid, text: (await templates[typeName]?.(new UnigraphObject(obj))) || '' })),
    );
} else ret = templates[typeName]?.(data) || '';

return ret;

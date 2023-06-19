const getSinceLastMinute = () => new Date(new Date().getTime() - 1000 * (60 + 10)).toJSON();
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

const noteQuery = `12(func: uid(noteEntities)) @filter(type(Entity)) ${noteQueryDetailed()}
    
  var(func: eq(<unigraph.id>, "$/schema/note_block")) {
    <~type> @filter(gt(<_updatedAt>, "${getSinceLastMinute()}")) {
        noteEntities as uid
    }
  }`;

const t1 = new Date().getTime();

const notes = (await unigraph.getQueries([noteQuery], false))[0];

const t2 = new Date().getTime();

if (t2 - t1 > 100) console.log('[Semantic Index] Last minute notes query too slow :((');

const objs = notes.map((el) => new UnigraphObject(el));

const pages = parseNotesAsLists(objs);
const res = pages
    .map((mkd, idx) => {
        const text = parsePostProcess(mkd, []);
        const title = objs[idx].get('text')?.as('primitive') || '';
        // remove images
        const finalText = text.replace(/\!\[[^\[\]]*\]\([^\(\)]*\) ?/g, '');
        const finalTitle = title.replace(/\!\[[^\[\]]*\]\([^\(\)]*\) ?/g, '');
        return {
            text: `Note: ${finalTitle}
Contents in Markdown:${finalText}`,
            uid: objs[idx]?.uid,
            title: finalTitle,
            type: '$/schema/note_block',
        };
    })
    .filter((el) => el.text.length > 10);

const fetch = require('node-fetch');

const apikey = unigraph.getSecret('openai', 'api_key');
const apiurl2 = `https://api.openai.com/v1/engines/text-search-curie-doc-001/embeddings`;
const endpoint = unigraph.getSecret('pinecone', 'endpoint_url');
const pineconeKey = unigraph.getSecret('pinecone', 'api_key');
const { encode, decode } = require('gpt-3-encoder');

if (res.length) {
    // console.log(res);
    const tokens = res.map((el) => decode(encode(el.text).slice(0, 2000)));

    const response2 = await fetch(apiurl2, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
        },
        method: 'POST',
        body: JSON.stringify({
            input: tokens,
        }),
    });
    const data2 = await response2.json();
    if (!data2.data) throw new Error(JSON.stringify(data2));
    const pineconeData2 = data2.data.map((el) => ({
        values: el.embedding,
        id: res[el.index].uid,
        type: res[el.index].type,
    }));
    // console.log(pineconeData2);

    const response4 = await fetch(`${endpoint}/vectors/upsert`, {
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': pineconeKey,
        },
        method: 'POST',
        body: JSON.stringify({
            vectors: pineconeData2,
            namespace: 'search',
        }),
    });
    const data4 = await response4.json();

    if (data4?.upsertedCount === res.length) {
        const finalTime = new Date().getTime();
        console.log(
            `[Semantic Index] Successfully added ${res.length} new note items to pinecone endpoint at ${endpoint}`,
        );
        console.log(`[Semantic Index] Took ${(finalTime - t1) / 1000} seconds.`);
    }

    const triplets = res.map((el) => `<${el.uid}> <_embedding> "${endpoint}" .`);
    await unigraph.updateTriplets(triplets, undefined, []);
}

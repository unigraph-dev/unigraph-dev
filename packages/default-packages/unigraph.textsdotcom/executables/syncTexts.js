const os = require('os');
const path = require('path');
const bs = require('@signalapp/better-sqlite3'); // https://github.com/signalapp/better-sqlite3

let db;

async function getUnlockedDb() {
    if (db) return db;

    const keyHex = unigraph.getSecret('textsdotcom', 'key');
    console.log({ keyHex });

    const dbPath = path.join(os.homedir(), 'Library/Application Support/jack/.index.db');
    db = bs(dbPath);

    const pragmaKeySql = `PRAGMA key = "x'${keyHex}'";`;
    db.exec(pragmaKeySql);

    return db;
}

const getQuery = (id) => `(func: uid(parIds)) @cascade { 
    uid
    _value {
      thread_id @filter(eq(<_value.%>, "${id}"))
    }
    _updatedAt
}`;

const getQuery2 = (id) => `(func: uid(parIds)) @cascade { 
    uid
    _value {
      message_id @filter(eq(<_value.%>, "${id}"))
    }
}`;

async function findThreads() {
    const db = await getUnlockedDb();

    const threadsRaw = db
        .prepare('select * from threads')
        .all()
        .filter((el) => el.accountID?.includes('imessage'));
    const msgsRaw = db
        .prepare('select * from messages order by timestamp desc limit 500')
        .all()
        .filter((el) => el.accountID?.includes('imessage'));
    const threads = threadsRaw.map((el) => ({
        ...el,
        thread: JSON.parse(el.thread),
    }));
    const msgs = msgsRaw.map((el) => ({
        ...el,
        threadID: `${el.accountID.split('_')[0]}_${el.threadID}`,
        message: JSON.parse(el.message),
    }));

    // console.log(msgs.slice(0, 10));

    const threadObjs = threads
        .map((el) => {
            const provider = el.accountID.split('_')[0];
            return {
                thread_id: `${provider}_${el.threadID}`,
                unread: el.thread.isUnread,
                participants: (el.thread.participants?.items || [])?.map((el) => `<${el.id}>`),
                service_type: provider,
                _updatedAt: el.thread.timestamp,
            };
        })
        .sort((a, b) => new Date(b._updatedAt).getTime() - new Date(a._updatedAt).getTime());

    const results = await unigraph.getQueries(
        [...threadObjs.map((el) => getQuery(el.thread_id))],
        false,
        70,
        `var(func: eq(<unigraph.id>, "$/schema/text_thread")) {
    <~type> { parIds as uid }
}`,
    );
    const threadTimestamps = Object.fromEntries(
        threadObjs.map((el, idx) => [el.thread_id, results[idx]?.[0]?._updatedAt || 0]),
    );
    // console.log(threadTimestamps);
    const first50 = threadObjs.slice(0, 100).map((el, idx) => (results[idx].length ? { ...el, participants: [] } : el));
    const maybeNewEntries = msgs.filter(
        (el) =>
            first50.find((thread) => el.threadID === thread.thread_id) &&
            new Date(threadTimestamps[el.threadID]).getTime() < new Date(el.timestamp).getTime(),
    );
    const results2 = await unigraph.getQueries(
        [...maybeNewEntries.map((el) => getQuery2(el.messageID))],
        false,
        170,
        `var(func: eq(<unigraph.id>, "$/schema/text_message")) {
    <~type> { parIds as uid }
}`,
    );
    // console.log(results2)
    const newEntries = maybeNewEntries.filter((_, idx) => results2[idx]?.length === 0);
    console.log({ maybeLength: maybeNewEntries.length, newLength: newEntries.length });
    const entriesObj = newEntries.map((el) => ({
        content: {
            _value: (el.message.text || '') + (el.message.attachments || []).map((att) => att.fileName).join('; '),
            type: { 'unigraph.id': '$/schema/markdown' },
        },
        is_sender: el.message.isSender,
        message_id: el.messageID,
        message: {
            sender: [
                {
                    identifier: `<${el.message.senderID}>`,
                    person: `<${el.message.senderID}>`,
                },
            ],
        },
        _updatedAt: el.message.timestamp,
    }));
    console.log(threadObjs[0]);
    console.log(entriesObj);
    const uids = await unigraph.addObject(entriesObj, '$/schema/text_message');

    // TODO: New entries -> add & group with threads
    await unigraph.addObject(
        first50.map((el) => ({
            ...el,
            messages: newEntries
                .map((msg, idx) => (msg.threadID === el.thread_id ? { uid: uids[idx] } : undefined))
                .filter(Boolean),
        })),
        '$/schema/text_thread',
    );
}

findThreads();

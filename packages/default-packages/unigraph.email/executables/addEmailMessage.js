const msgs = context.params.messages;
const dontCheckUnique = context.params.dont_check_unique;
const { simpleParser } = require('mailparser');

const parsed = await Promise.all(msgs.map((it) => simpleParser(it.message)));

const getQuery = (msgid) => `(func: uid(parIds)) @cascade { 
    uid
    _value {
      message_id @filter(eq(<_value.%>, "${msgid}"))
    }
}`;

const dest = parsed.map((el, index) => {
    return {
        name: {
            type: { 'unigraph.id': '$/schema/note' },
            _value: el.subject || '',
        },
        ...(msgs[index].externalUrl
            ? {
                  $context: {
                      _externalUrl: msgs[index].externalUrl,
                  },
              }
            : {}),
        message_id: el.messageId,
        message: {
            date_received: el.date?.toISOString?.() || new Date(0).toISOString(),
            sender: (el.from?.value || [])
                .filter((it) => it.address)
                .map((it) => ({
                    person: `${it.name} <${it.address}>`,
                    identifier: it.address,
                })),
            recipient: (el.to?.value || [])
                .filter((it) => it.address)
                .map((it) => ({
                    person: `${it.name} <${it.address}>`,
                    identifier: it.address,
                })),
        },
        content: {
            abstract: {
                type: { 'unigraph.id': '$/schema/note' },
                _value: el?.text?.slice(0, 100) || 'No preview available',
            },
            text: {
                type: { 'unigraph.id': '$/schema/html' },
                _value: el.html || el.textAsHtml || el.text || '',
            },
        },
        _updatedAt: el.date?.toISOString?.() || new Date(0).toISOString(),
    };
});

const results = dontCheckUnique
    ? dest.map((el) => [])
    : await unigraph.getQueries(
          [...dest.map((el) => getQuery(el.message_id))],
          false,
          50,
          `var(func: eq(<unigraph.id>, "$/schema/email_message")) {
        <~type> { parIds as uid }
    }`,
      );

const readMask = [];
const inboxMask = [];
const toAdd = [];

const inboxEls = [];
let count = 0;

for (let i = 0; i < dest.length; ++i) {
    if (results[i].length === 0) {
        count++;
        toAdd.push(dest[i]);
        readMask.push(msgs[i]?.read);
        inboxMask.push(msgs[i]?.inbox);
    }
}

const toAddChunks = toAdd.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 100);

    if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
}, []);

const uids = [];
for (let i = 0; i < toAddChunks.length; i += 1) {
    try {
        const res = await unigraph.addObject(toAddChunks[i], '$/schema/email_message');
        uids.push(...res);
    } catch (e) {
        uids.push(...Array(100).fill(undefined));
        console.log(e);
    }
}

// const inboxEntries = await unigraph.getObject('$/entity/inbox').then((x) => x._value.children._value ?? []);
// const inboxEntryUids = inboxEntries.map((x) => x._value._value.uid);

// const mirrorEmailInbox = unigraph.getState('settings/email/mirrorEmailInbox').value;
uids.forEach((el, index) => {
    if (inboxMask[index] && el) inboxEls.push(el);
    // const elShouldBeInbox = (mirrorEmailInbox ? inboxMask[index] : !readMask[index]) && el;
    // const elInInbox = inboxEntryUids.includes(el);
    // if (elShouldBeInbox && !elInInbox) inboxEls.push(el);
});

await unigraph.runExecutable('$/executable/add-item-to-list', {
    where: '$/entity/inbox',
    item: inboxEls.reverse(),
});
if (count > 0)
    setTimeout(
        () =>
            unigraph.addNotification({
                name: 'Inboxes synced',
                from: 'unigraph.email',
                content: `Added ${count} emails (${inboxEls.length} in inbox).`,
                actions: [],
            }),
        1000,
    );

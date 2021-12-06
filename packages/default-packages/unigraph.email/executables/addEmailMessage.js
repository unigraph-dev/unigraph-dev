const msgs = context.params.messages;
const dontCheckUnique = context.params.dont_check_unique;
const simpleParser = require('mailparser').simpleParser;

const parsed = await Promise.all(msgs.map(it => simpleParser(it.message)));

const getQuery = (msgid) => `(func: uid(parIds)) @cascade { 
    uid
    _value {
      message_id @filter(eq(<_value.%>, "${msgid}"))
    }
}`

const dest = parsed.map((el) => {
    return {
        name: {
            type: {"unigraph.id": "$/schema/note"},
            _value: el.subject || ""
        },
        message_id: el.messageId,
        message: {
            date_received: el.date.toISOString(),
            sender: [el.from?.text].filter(it => it !== undefined),
            recipient: [el.to?.text].filter(it => it !== undefined),
        },
        content: {
            abstract: {
                type: {"unigraph.id": "$/schema/note"},
                _value: el?.text?.slice(0, 100) || "No preview available",
            },
            text: {
                type: {"unigraph.id": "$/schema/html"},
                _value: el.html || el.textAsHtml || el.text || ""
            }
        },
        _updatedAt: el.date.toISOString()
    }
})

const results = dontCheckUnique ? dest.map(el => []) : await unigraph.getQueries([...(dest.map(el => getQuery(el.message_id))), `var(func: eq(<unigraph.id>, "$/schema/email_message")) {
    <~type> { parIds as uid }
}`]);

let readMask = []
let toAdd = []

let inbox_els = []
let count = 0

for (let i=0; i<dest.length; ++i) {
    if (results[i].length === 0) {
        count ++;
        toAdd.push(dest[i]);
        readMask.push(msgs[i]?.read);
    }
}

console.log(count);

const uids = await unigraph.addObject(toAdd, '$/schema/email_message');
uids.forEach((el, index) => {if (!readMask[index]) inbox_els.push(el)});

await unigraph.runExecutable("$/executable/add-item-to-list", {where: "$/entity/inbox", item: inbox_els.reverse()});
setTimeout(() => unigraph.addNotification({name: "Inboxes synced", from: "unigraph.email", content: "Added " + count + " emails (" + inbox_els.length + " unread).", actions: []}), 1000); 
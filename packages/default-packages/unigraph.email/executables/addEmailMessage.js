const msgs = context.params.messages;
const simpleParser = require('mailparser').simpleParser;

const parsed = await Promise.all(msgs.map(it => simpleParser(it.message)));

const getQuery = (msgid) => `(func: type(Entity)) @cascade { 
    uid
	type @filter(eq(<unigraph.id>, "$/schema/email_message"))
    _value {
      message_id @filter(eq(<_value.%>, "${msgid}"))
    }
}`

const dest = parsed.map((el) => {
    return {
        name: el.subject,
        message_id: el.messageId,
        message: {
            date_received: el.date.toISOString(),
            sender: [el.from?.text].filter(it => it !== undefined),
            recipient: [el.to?.text].filter(it => it !== undefined),
        },
        content: {
            abstract: el?.text?.slice(0, 100) || "No preview available",
            text: el.html || el.textAsHtml || el.text
        },
        _timestamp: {
            _updatedAt: el.date.toISOString()
        }
    }
})

const results = await unigraph.getQueries(dest.map(el => getQuery(el.message_id)));

let inbox_els = []
let count = 0

for (let i=0; i<dest.length; ++i) {
    if (results[i].length === 0) {
        count ++;
        const uid = await unigraph.addObject(dest[i], '$/schema/email_message');
        if (msgs[i]?.read === false) inbox_els.push(uid[0]);
    }
}

await unigraph.runExecutable("$/executable/add-item-to-list", {where: "$/entity/inbox", item: inbox_els.reverse()});
setTimeout(() => unigraph.addNotification({name: "Inboxes synced", from: "unigraph.email", content: "Added " + count + " items.", actions: []}), 1000); 
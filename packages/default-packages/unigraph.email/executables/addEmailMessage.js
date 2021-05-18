const msgs = context.params.messages;
const simpleParser = require('mailparser').simpleParser;

const parsed = await Promise.all(msgs.map(it => simpleParser(it.message)));

const dest = parsed.map((el) => {
    return {
        name: el.subject,
        message_id: el.messageId,
        message: {
            date_received: el.date,
            sender: [el.from?.text],
            recipient: [el.to?.text],
        },
        content: {
            text: el.html
        }
    }
})

console.log(dest[0]);
await unigraph.addObject(dest[0]);
await unigraph.addObject(dest[0]);
const results = await unigraph.getQueries([
    `(func: type(Entity)) @cascade @filter((NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) {
    uid
    type @filter(eq(<unigraph.id>, "$/schema/todo") OR eq(<unigraph.id>, "$/schema/note_block")
        OR eq(<unigraph.id>, "$/schema/rss_feed") OR eq(<unigraph.id>, "$/schema/tag") OR eq(<unigraph.id>, "$/schema/web_bookmark")) {
        unigraph.id
    }
}`,
]);
const uids = results[0].map((el) => el.uid) || [];
const exports = await unigraph.exportObjects(uids, {});
const fs = require('fs');

fs.writeFileSync('exports.json', JSON.stringify(exports));

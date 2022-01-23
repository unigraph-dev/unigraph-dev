const uids = context?.params?.uids || [];

const urls = (await unigraph.getQueries(uids.map((el) => `(func: uid(${el})) {_value {url {_value { <_value.%>}}}}`)))
    .map((el, idx) => [uids[idx], el[0]?._value.url._value['_value.%']])
    .filter((el) => el[1] !== undefined);

const batchedUrls = urls.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 10);

    if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
}, []);

const articles_pre = [];
for (let i = 0; i < batchedUrls.length; ++i) {
    const batch = batchedUrls[i];
    const res = await Promise.all(
        batch.map((el) => unigraph.runExecutable('$/executable/fulltextify', { url: el[1] })),
    );
    articles_pre.push(...res);
    console.log(`Processed URL batch count: ${articles_pre.length.toString()}`);
}

const articles = articles_pre.map((el, idx) => [urls[idx][0], el]).filter((el) => el[1] !== undefined);

console.log('Finished processing everything...');
console.log(articles.length);

for (let i = 0; i < articles.length; ++i) {
    console.log('Adding article #', i);
    await unigraph.updateObject(articles[i][0], {
        creative_work: {
            author: articles[i][1].byline || undefined,
            text: { type: { 'unigraph.id': '$/schema/html' }, _value: articles[i][1].content || '' },
            abstract: { type: { 'unigraph.id': '$/schema/note' }, _value: articles[i][1].excerpt || '' },
        },
    });
}

#!/usr/bin/env deno run --allow-net
const query = Deno.args[0];

function getObjectAsRecursivePrimitive (object) {
    let targetValue = undefined;
    if (object) Object.keys(object).forEach(el => {
        if (el.startsWith("_value.")) {
            targetValue = object[el];
        } else if (el.startsWith("_value") && typeof object[el] === "object") {
            const subObj = getObjectAsRecursivePrimitive(object[el]);
            if (subObj) targetValue = subObj;
        }
    });
    return targetValue;
}

fetch('http://localhost:4001/get_search_results?method=fulltext&display=indexes&query=' + query)
	.then(res => res.text())
	.then(text => {
		const resObj = JSON.parse(text);
		let retEntities = resObj.results.entities.map(el => { return {
			uid: el.uid,
			title: getObjectAsRecursivePrimitive(el?.['unigraph.indexes']?.name) || el.uid,
			subtitle: (el?.['type']?.['unigraph.id'] || "Unigraph entity") + " - uid: " + el.uid,
			valid: true
		}})
		if (!retEntities.length) retEntities = [{title: "No results"}]
		console.log(JSON.stringify({items: retEntities}))
	})
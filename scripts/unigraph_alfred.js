#!/usr/bin/env deno run --allow-net
const query = Deno.args[0];
fetch('http://localhost:4001/get_search_results?method=fulltext&query=' + query)
	.then(res => res.text())
	.then(text => {
		const resObj = JSON.parse(text);
		let retEntities = resObj.results.entities.map(el => { return {
			uid: el.uid,
			title: el?.['_value']?.['name']?.['_value']?.['_value']?.['_value.%'] || el.uid,
			subtitle: el?.['type']?.['unigraph.id'] || "Unigraph entity",
			valid: true
		}})
		if (!retEntities.length) retEntities = [{title: "No results"}]
		console.log(JSON.stringify({items: retEntities}))
	})
const resQueries = {
    "indexes": (qual: string, filter: string) => `result(${qual}) @filter(${filter} type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) {
        uid
        type {
          unigraph.id
        }
        unigraph.id
        unigraph.indexes {
          uid 
          expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
            uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
        }
    }`,
    "uids": (qual: string, filter: string) => `result(${qual}) @filter(${filter} type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) {
        uid
    }`,
    "metadata": (qual: string, filter: string) => `result(${qual}) @filter(${filter} type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) {
        uid
        type {
            unigraph.id
        }
    }`,
    "default": (qual: string, filter: string) => `result(${qual}) @filter(${filter} type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) @recurse(depth: 15) {
        uid
        expand(_userpredicate_)
        unigraph.id
    }`,
}

const getQualUids = (h: number) => {
    const quals: string[] = [];
    for (let i=0; i<h; ++i) {
        quals.push(`uhops${i}`);
    }
    return quals.join(', ')
}

const getQualFromOptions = (options: any) => {
    let result = "";
    if (options.limit) result += "first: " + options.limit
    return result.length ? ", " + result : "";
}

/**
 * Construct GraphQL+- query for searches.
 * @param queryString Query in GraphQL+- format for entity parts. Example: `(func: alloftext(<_value.%>, "Hello world"))`
 * @param display 
 * @param hops 
 */
export const makeSearchQuery = (
    queryString: string[], 
    display: "indexes" | "uids" | "metadata" | undefined,
    hops = 2, // 1 to 4,
    searchOptions: any = {},
): string => {
    const qhops: string[] = [];
    for (let i=0; i<hops; ++i) {
        qhops.push(`qhops${(i+1).toString()}(func: uid(uhops${i.toString()})) {
            <unigraph.origin> {
                ${i === hops-1 ? "" : `uhops${(i+1).toString()} as `}uid
            }
        }`)
    }
    const resultQuery = resQueries[display || "default"](`func: uid(${getQualUids(hops)})${getQualFromOptions(searchOptions)}`, queryString[2])
    const fq = `query {
        ${queryString[0]}
        uhops0 as var${queryString[1]}
        ${searchOptions.noPrimitives ? "" : `qhops0(func: uid(uhops0)) {
            uid
            <_value.%>
        }`}
        ${qhops.join('\n')}
        ${resultQuery}
    }`
    console.log(fq)
    return fq;
}

export const getQueryString = (query: {method: "fulltext" | "type" | "uid", value: any}[]) => {
    const entityQueries: string[] = [];
    const resultQueries: string[] = [];
    const queries = query.map((el, index) => {
        if (el.method === "fulltext") {
            if (el.value.startsWith('/') && el.value.endsWith('/')) {
                resultQueries.push(`queryresult${index.toString()}`); return `queryresult${index.toString()} as var(func: regexp(<_value.%>, ${el.value}i))`;
            } else {
                resultQueries.push(`queryresult${index.toString()}`); return `queryresult${index.toString()} as var(func: alloftext(<_value.%>, "${el.value}"))`;
            }
        }
        else if (el.method === "type") {entityQueries.push(`queryresult${index.toString()}`); return `var(func: eq(<unigraph.id>, "${el.value}")) { <~type> { queryresult${index.toString()} as uid } }`}
        else if (el.method === "uid") {resultQueries.push(`queryresult${index.toString()}`); return `queryresult${index.toString()} as var(func: uid(${el.value}))`}
    })
    return [queries.join('\n'), `(func: uid(${resultQueries.join(', ')}))`, entityQueries.length ? `uid(${entityQueries.join(', ')}) AND ` : ""]
}
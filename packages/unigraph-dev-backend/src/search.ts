const resQueries = {
    "indexes": (qual: string) => `result(${qual}) @filter(type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) {
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
    "uids": (qual: string) => `result(${qual}) @filter(type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) {
        uid
    }`,
    "default": (qual: string) => `result(${qual}) @filter(type(Entity) AND (NOT eq(<_propertyType>, "inheritance")) AND (NOT eq(<_hide>, true))) @recurse(depth: 15) {
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

/**
 * Construct GraphQL+- query for searches.
 * @param queryString Query in GraphQL+- format for entity parts. Example: `(func: alloftext(<_value.%>, "Hello world"))`
 * @param display 
 * @param hops 
 */
export const makeSearchQuery = (
    queryString: string, 
    display: "indexes" | "uids" | undefined,
    hops = 2, // 1 to 4
): string => {
    const qhops: string[] = [];
    for (let i=0; i<hops; ++i) {
        qhops.push(`qhops${(i+1).toString()}(func: uid(uhops${i.toString()})) {
            <unigraph.origin> {
                ${i === hops-1 ? "" : `uhops${(i+1).toString()} as `}uid
            }
        }`)
    }
    const resultQuery = resQueries[display || "default"](`func: uid(${getQualUids(hops)})`)
    return `query {
        uhops0 as var${queryString}
        qhops0(func: uid(uhops0)) {
            uid
            <_value.%>
        }
        ${qhops.join('\n')}
        ${resultQuery}
    }`
}

export const getFullTextQueryString = (search: string) => `(func: alloftext(<_value.%>, "${search}"))`
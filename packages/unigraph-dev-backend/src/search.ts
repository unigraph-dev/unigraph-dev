/* eslint-disable max-len */
const getQueryHead = (qual: string, options: string, filter: string, showHidden: boolean) =>
    `result(${qual}${options}) @filter(${filter} type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_propertyType>, "inheritance")) ${
        showHidden ? '' : 'AND (NOT eq(<_hide>, true))'
    })`;

// TODO: move this to more flexible query
export const makeNameQuery = (name: string, hideHidden?: boolean) => `query {
    uhops0 as var(func: alloftext(<_value.%>, "${name.replace(/"/g, '\\"')}"))
    var(func: uid(uhops0)) {
        <unigraph.origin> @filter(type(Entity)) {
            uhops1 as uid
        }
    }
    filteredEntity as var(func: uid(uhops1)) @filter((NOT type(Deleted)) AND NOT (uid(uhops0)) AND (NOT eq(<_propertyType>, "inheritance")) ${
        hideHidden ? 'AND (NOT eq(<_hide>, true))' : ''
    } AND has(_updatedAt)) {
    incoming as count(<unigraph.origin>) @filter(type(Entity))
}
result_top(func: uid(filteredEntity), orderdesc: val(incoming)) @filter(gt(val(incoming), 5)) {uid _updatedAt
    type {
      unigraph.id
    }
    unigraph.id
    unigraph.indexes {
      expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
        uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
      
}}
      result(func: uid(filteredEntity), orderdesc: _updatedAt, first: 200) @filter(has(<unigraph.indexes>)) {
    uid
    _updatedAt
    type {
      unigraph.id
    }
    unigraph.indexes {
      expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
        uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
      
}
}
}`;

const resQueries = {
    indexes: (qual: string, options: string, filter: string, showHidden: boolean, _: string) => `var${getQueryHead(
        qual,
        '',
        filter,
        showHidden,
    )} {
        incoming as sum(<unigraph.origin>) @filter(type(Entity))
    }
    ${getQueryHead(
        `${qual}, orderdesc: val(incoming), orderdesc: _updatedAt`,
        options,
        `${filter} AND has(<unigraph.indexes>)`,
        showHidden,
    )} {
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
    uids: (qual: string, options: string, filter: string, showHidden: boolean, _: string) => `${getQueryHead(
        qual,
        options,
        filter,
        showHidden,
    )} {
        uid
    }`,
    metadata: (qual: string, options: string, filter: string, showHidden: boolean, _: string) => `var${getQueryHead(
        qual,
        '',
        filter,
        showHidden,
    )} {incoming as sum(val(incoming2))
        <unigraph.origin> @filter(type(Entity)) {
          incoming2 as count(<unigraph.origin>) @filter(type(Entity) AND uid(uhops0, uhops1))
        }
    }
    ${getQueryHead(`${qual}, orderdesc: val(incoming), orderdesc: _updatedAt`, options, filter, showHidden)} {
        uid
        type {
            unigraph.id
        }
        score : val(incoming)
    }`,
    custom: (qual: string, options: string, filter: string, showHidden: boolean, body: string) =>
        `${getQueryHead(qual, options, filter, showHidden)} ${body}`,
    default: (qual: string, options: string, filter: string, showHidden: boolean, _: string) => `${getQueryHead(
        qual,
        options,
        filter,
        showHidden,
    )} @recurse(depth: 15) {
        uid
        expand(_userpredicate_)
        unigraph.id
    }`,
};

const getQualUids = (h: number) => {
    const quals: string[] = [];
    for (let i = 0; i < h; i += 1) {
        quals.push(`uhops${i}`);
    }
    return quals.join(', ');
};

const getQualFromOptions = (options: any) => {
    let result = '';
    if (options.limit) result += `first: ${options.limit}`;
    return result.length ? `, ${result}` : '';
};

/**
 * Construct GraphQL+- query for searches.
 * @param queryString Query in GraphQL+- format for entity parts. Example: `(func: alloftext(<_value.%>, "Hello world"))`
 * @param display
 * @param hops
 */
export const makeSearchQuery = (
    queryString: string[],
    display: 'indexes' | 'uids' | 'metadata' | undefined,
    hops = 2, // 1 to 4,
    searchOptions: any = {},
): string => {
    const qhops: string[] = [];
    for (let i = 0; i < hops - 1; i += 1) {
        qhops.push(`qhops${(i + 1).toString()}(func: uid(uhops${i.toString()})) {
            <unigraph.origin> {
                uhops${(i + 1).toString()} as uid
            }
        }`);
    }
    const resultQuery = resQueries[display || 'default'](
        `func: uid(${getQualUids(hops)})`,
        getQualFromOptions(searchOptions),
        queryString[2],
        searchOptions.hideHidden === false,
        searchOptions.body,
    );
    const fq = `query {
        ${queryString[0]}
        uhops0 as var${queryString[1]}
        ${
            searchOptions.noPrimitives
                ? ''
                : `qhops0(func: uid(uhops0)) {
            uid
            <_value.%>
        }`
        }
        ${qhops.join('\n')}
        ${resultQuery}
    }`;
    console.log(fq);
    return fq;
};

export const getQueryString = (query: { method: 'fulltext' | 'type' | 'uid'; value: any }[]) => {
    const entityQueries: string[] = [];
    const resultQueries: string[] = [];
    const queries = query.map((el, index) => {
        if (el.method === 'fulltext') {
            if (el.value.startsWith('/') && el.value.endsWith('/')) {
                resultQueries.push(`queryresult${index.toString()}`);
                return `queryresult${index.toString()} as var(func: regexp(<_value.%>, ${el.value}i))`;
            }
            resultQueries.push(`queryresult${index.toString()}`);
            return `queryresult${index.toString()} as var(func: alloftext(<_value.%>, "${el.value}"))`;
        }
        if (el.method === 'type') {
            entityQueries.push(`queryresult${index.toString()}`);
            return `var(func: eq(<unigraph.id>, "${el.value}")) { <~type> { queryresult${index.toString()} as uid } }`;
        }
        if (el.method === 'uid') {
            resultQueries.push(`queryresult${index.toString()}`);
            return `queryresult${index.toString()} as var(func: uid(${el.value}))`;
        }
        return '';
    });
    return [
        queries.join('\n'),
        `(func: uid(${resultQueries.join(', ')}))`,
        entityQueries.length ? `uid(${entityQueries.join(', ')}) AND ` : '',
    ];
};

import React from "react"
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph"
import ForceGraph2D from 'react-force-graph-2d';
import { SizeMe } from "react-sizeme";

export const GraphView = ({uid}: any) => {
    const [entities, setEntities] = React.useState<any>([]);

    React.useEffect(() => {
        const id = getRandomInt();
        
        // name can be either plain or interface
        window.unigraph.subscribeToQuery(`(func: uid(${uid})) {
            <unigraph.origin> @filter((NOT eq(<_hide>, true)) AND (NOT eq(<_propertyType>, "inheritance"))) {
                uid _value {
                    name {
                        <_value.%>
                        <_value> { <_value> { <_value.%> } }
                    }
                    text { <_value> { <_value> { <_value.%> } } }
                }
                <type> { <unigraph.id> }
            }
        }`, (res: any) => {
            const entities = res[0]['unigraph.origin'].filter((el: any) => el.type !== undefined).map((el: any) => { return {
                id: el.uid,
                type: el['type']?.['unigraph.id'],
                name: el?.['_value']?.['name']?.['_value.%'] || el?.['_value']?.['name']?.['_value']?.['_value']?.['_value.%'] || el?.['_value']?.['text']?.['_value']?.['_value']?.['_value.%'] || "No name"
            }})
            setEntities(entities);
        }, id, true);

        return function cleanup () { window.unigraph.unsubscribe(id); }
    }, [])

    return <div>
        This is graph view! {uid}
        <SizeMe>{({size}) => <ForceGraph2D 
            width={size.width || undefined} height={size.height || undefined}
            nodeAutoColorBy={(node) => (node as any).type}
            nodeLabel={(node) => (node as any).name}
            graphData={{nodes: entities, links: entities.map((el: any) => {return {source: uid, target: el['id']}})}} 
        />}</SizeMe>
    </div>
}
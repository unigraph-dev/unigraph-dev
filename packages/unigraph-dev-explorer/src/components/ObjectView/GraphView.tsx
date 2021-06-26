import React from "react"
import { getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/api/unigraph"
import ForceGraph2D from 'react-force-graph-2d';
import { SizeMe } from "react-sizeme";
import _ from "lodash";

export const GraphView = ({uid}: any) => {
    const [entities, setEntities] = React.useState<any>([]);

    React.useEffect(() => {
        const id = getRandomInt();
        
        // name can be either plain or interface
        window.unigraph.subscribeToQuery(`(func: uid(${uid})) {
            <unigraph.origin> @filter((NOT eq(<_hide>, true)) AND (NOT eq(<_propertyType>, "inheritance"))) {
                uid 
                unigraph.indexes {
                    uid
                    name {
                        uid 
                        expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
                            uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
                    }
                }
                <type> { <unigraph.id> }
            }
            <~unigraph.origin> @filter((NOT eq(<_hide>, true)) AND (NOT eq(<_propertyType>, "inheritance"))) {
                uid 
                unigraph.indexes {
                    uid
                    name {
                        uid 
                        expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) { 
                            uid expand(_userpredicate_) { uid expand(_userpredicate_) { uid expand(_userpredicate_) } } } } }
                    }
                }
                <type> { <unigraph.id> }
            }
        }`, (res: any) => {
            console.log(res);
            const [entitiesInto, entitiesOutof] = ([res[0]['unigraph.origin'], res[0]['~unigraph.origin']]).map(el => el.filter((el: any) => el.type !== undefined).map((el: any) => { return {
                id: el.uid,
                type: el['type']?.['unigraph.id'],
                name: (new UnigraphObject(el?.['unigraph.indexes']?.['name'])).as("primitive") || "No name"
            }}))
            setEntities(_.uniqBy([...entitiesInto, ...entitiesOutof], el => el.id));
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
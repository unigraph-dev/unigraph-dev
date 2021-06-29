import React from "react"
import { getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/api/unigraph"
import ForceGraph2D from 'react-force-graph-2d';
import { SizeMe } from "react-sizeme";
import _ from "lodash";

const queryNameIndex = `@filter((NOT eq(<_propertyType>, "inheritance"))) {
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
}`

export const GraphView = ({uid}: any) => {
    const [entities, setEntities] = React.useState<any>([]);

    React.useEffect(() => {
        const id = getRandomInt();
        
        // name can be either plain or interface
        window.unigraph.subscribeToQuery(`(func: uid(${uid})) {
            <unigraph.origin> ${queryNameIndex}
            <~unigraph.origin> ${queryNameIndex}
        }`, (res: any) => {
            console.log(res);
            const [entitiesInto, entitiesOutof] = ([res[0]['unigraph.origin'], res[0]['~unigraph.origin']]).map(el => el?.filter((el: any) => el.type !== undefined).map((el: any) => { return {
                id: el.uid,
                type: el['type']?.['unigraph.id'],
                name: (new UnigraphObject(el?.['unigraph.indexes']?.['name'])).as("primitive") || "No name"
            }}))
            setEntities(_.uniqBy([...(entitiesInto || []), ...(entitiesOutof || [])], el => el.id));
        }, id, true);

        return function cleanup () { window.unigraph.unsubscribe(id); }
    }, [])

    return <div>
        This is graph view! {uid}
        <SizeMe>{({size}) => <ForceGraph2D 
            width={size.width || undefined} height={size.height || undefined}
            nodeAutoColorBy={(node) => (node as any).type}
            nodeLabel={(node: any) => `Name: ${node.name}\n Type: ${node.type}`}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const label = (node as any).name;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = typeof label === "string" ? ctx.measureText(label).width : 10;
                const [w, h] = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
    
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect((node.x || 0) - w / 2, (node.y || 0) - h / 2, w, h);
    
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = ((node as any).color || "");
                ctx.fillText(label?.toString() || "", node.x || 0, node.y || 0);
    
                (node as any).__bckgDimensions = [w, h]; // to re-use in nodePointerAreaPaint
            }}
            graphData={{nodes: entities, links: entities.map((el: any) => {return {source: uid, target: el['id']}})}} 
        />}</SizeMe>
    </div>
}
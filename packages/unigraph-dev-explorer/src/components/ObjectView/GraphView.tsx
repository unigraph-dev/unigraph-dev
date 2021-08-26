import React from "react"
import { getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/api/unigraph"
import ForceGraph2D from 'react-force-graph-2d';
import { SizeMe } from "react-sizeme";
import _ from "lodash";
import { Checkbox, List, ListItem, Typography } from "@material-ui/core";

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

const excludableTypes = ['$/schema/subentity', '$/schema/interface/textual']
const getExcluded = (id: number) => excludableTypes.reduce((prev, curr, idx) => (!!((id >> idx) % 2)) ? [...prev, curr] : prev, [] as string[])

export const GraphView = ({uid}: any) => {
    const [entities, setEntities] = React.useState<any>([]);
    const [links, setLinks] = React.useState<any>([]);
    const [refs, setRefs] = React.useState<any>();
    const [typesExcluded, setTypesExcluded] = React.useState(3); // Bitmapped, types[0] => +-1, etc

    React.useEffect(() => {
        const id = getRandomInt();
        
        // name can be either plain or interface
        window.unigraph.subscribeToQuery(`(func: uid(${uid})) {
            <unigraph.origin> ${queryNameIndex}
            <~unigraph.origin> ${queryNameIndex}
        }`, (res: any) => {
            setRefs(res);
        }, id, true);

        return function cleanup () { window.unigraph.unsubscribe(id); }
    }, [])

    React.useEffect(() => {
        if (refs?.[0]) {
            console.log(refs);
            const llinks: any[] = [];
            const [entitiesInto, entitiesOutof] = ([refs[0]['unigraph.origin'], refs[0]['~unigraph.origin']])
                .map((el, idx: number) => 
                    el?.filter((el: any) => (el.type !== undefined && el.type['unigraph.id'].startsWith('$/schema') && !getExcluded(typesExcluded).includes(el.type['unigraph.id'])))
                        .map((el: any) => {
                            if (idx === 0) llinks.push({source: uid, target: el.uid})
                            else llinks.push({source: el.uid, target: uid})
                            return {
                                id: el.uid,
                                type: el['type']?.['unigraph.id'],
                                name: (new UnigraphObject(el?.['unigraph.indexes']?.['name'])).as("primitive") || "No name"
                            }
                }
            ))
            setEntities(_.uniqBy([...(entitiesInto || []), ...(entitiesOutof || [])], el => el.id));
            setLinks(llinks);
        }
    }, [refs, typesExcluded])

    return <div>
        <Typography>Graph view of object {uid}</Typography>
        <List style={{position: "absolute"}}>
            {excludableTypes.map((el, index) => <ListItem>
                <Checkbox checked={!!((typesExcluded >> index) % 2)} onClick={() => (typesExcluded >> index) % 2 ? setTypesExcluded(typesExcluded - (1 << index)) : setTypesExcluded(typesExcluded + (1 << index))}/>
                <Typography>{el}</Typography>
            </ListItem>)}
        </List>
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
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.1}
            graphData={{nodes: entities, links: links}} 
            onNodeClick={(node) => {
                window.wsnavigator(`/object-editor?uid=${node.id}`)
            }}
        />}</SizeMe>
    </div>
}
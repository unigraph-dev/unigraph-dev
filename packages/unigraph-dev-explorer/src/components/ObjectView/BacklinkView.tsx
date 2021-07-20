import { ListItem, Typography } from "@material-ui/core";
import React from "react";
import { useEffectOnce } from "react-use";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";

const getQuery = (uid: string) => `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_propertyType>, "inheritance"))) @recurse {
  uid
  <unigraph.id>
  expand(_userpredicate_)
}
var(func: uid(${uid})) {
  <unigraph.origin> {
      res as uid
  }
}`

export const BacklinkView = ({data}: any) => {

    const [objects, setObjects]: [any[], Function] = React.useState([]);
    const [id, setId] = React.useState(Date.now());

    useEffectOnce(() => {
        window.unigraph.subscribeToQuery(getQuery(data.uid), (objects: any[]) => { setObjects(buildGraph(objects)) }, id);

        return function cleanup () {
            window.unigraph.unsubscribe(id);
        }
    })

    return <div>
        <Typography gutterBottom variant="h4">
            Backlinks of: {data.get('name').as('primitive') || data.uid}
            <DefaultObjectListView objects={objects} component={ListItem}/>
        </Typography>
        
        
    </div>
}
import { ListItem, Typography } from "@material-ui/core";
import React from "react";
import { useEffectOnce } from "react-use";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";

const getQuery = (uid: string, forward?: boolean) => `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_propertyType>, "inheritance"))) @recurse(depth: 8) {
  uid
  <unigraph.id>
  expand(_userpredicate_)
}
var(func: uid(${uid})) {
  <${forward?"~":""}unigraph.origin> {
      res as uid
  }
}`

export const BacklinkView = ({data, hideHeader, forward}: any) => {

    const [objects, setObjects]: [any[], Function] = React.useState([]);
    const [id, setId] = React.useState(Date.now());

    useEffectOnce(() => {
        window.unigraph.subscribeToQuery(getQuery(data.uid, forward), (objects: any[]) => { setObjects(buildGraph(objects).filter((el: any) => el.uid !== data.uid)) }, id);

        return function cleanup () {
            window.unigraph.unsubscribe(id);
        }
    })

    return <div>
        <Typography gutterBottom variant="h4" style={{display: hideHeader ? "none" : "unset"}}>
            Backlinks of: {hideHeader || data.get('name').as('primitive') || data.uid}
        </Typography>
        <DefaultObjectListView objects={objects} component={ListItem}/>
    </div>
}
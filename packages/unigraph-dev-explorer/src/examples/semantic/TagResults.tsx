import { ListItem, Typography } from "@material-ui/core";
import React from "react";
import { useEffectOnce } from "react-use";
import { buildGraph } from "unigraph-dev-common/lib/api/unigraph";
import { DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";

const getQuery = (name: string) => `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_propertyType>, "inheritance"))) @recurse {
  uid
  <unigraph.id>
  expand(_userpredicate_)
}
frames as var(func: type(Entity)) @cascade {
  type @filter(eq(<unigraph.id>, "$/schema/tag")) {
      <unigraph.id>
  }
  _value {
      name @filter(eq(<_value.%>, "${name}")) {
          <_value.%>
      }
      
  }
}
var(func: uid(frames)) {
  <unigraph.origin> {
      res as uid
  }
}`

export const TagResults = ({name} : {name: string}) => {

    const [objects, setObjects]: [any[], Function] = React.useState([]);
    const [id, setId] = React.useState(Date.now());

    useEffectOnce(() => {
        window.unigraph.subscribeToQuery(getQuery(name), (objects: any[]) => { setObjects(buildGraph(objects)) }, id);

        return function cleanup () {
            window.unigraph.unsubscribe(id);
        }
    })

    return <div>
        <Typography gutterBottom variant="h4">
            All items with tag: {name}
            <DefaultObjectListView objects={objects} component={ListItem}/>
        </Typography>
        
        
    </div>
}
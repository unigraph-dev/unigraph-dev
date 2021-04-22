import { ListItem, Typography } from "@material-ui/core";
import React from "react";
import { useEffectOnce } from "react-use";
import { DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";

const getQuery = (name: string) => `(func: type(Entity)) @cascade {
    uid
    <_value> {
      semantic_properties {
        <_value> {
      	  <_value> {
            children {
            	<_value[> {
                <_value> {
                  type @filter(eq(<unigraph.id>, "$/schema/tag")) {
                    <unigraph.id>
                  }
                  <_value> {
                    name @filter(eq(<_value.%>, "${name}")){
                      <_value.%>
                    }
                  }
                }
              }
          }
        }
      }
      }
    }
}`

export const TagResults = ({name} : {name: string}) => {

    const [objects, setObjects]: [any[], Function] = React.useState([]);
    const [id, setId] = React.useState(Date.now());

    useEffectOnce(() => {
        window.unigraph.subscribeToQuery(getQuery(name), (objects: any[]) => { setObjects(objects) }, id);

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
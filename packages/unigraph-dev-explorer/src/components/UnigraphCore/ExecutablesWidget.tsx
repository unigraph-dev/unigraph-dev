import { Button, List, ListItem, Typography } from "@material-ui/core"
import React from "react"
import { useEffectOnce } from "react-use";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { upload } from "../../utils"; 
import { AutoDynamicView } from "../ObjectView/DefaultObjectView";

export const ExecutablesWidget: React.FC = ({}) => {

    const [content, setContent]: any = React.useState([])

    useEffectOnce(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToType("$/schema/executable", (execs: any[]) => {setContent(execs)}, id)

        return function cleanup() {
            window.unigraph.unsubscribe(id);
        }
    })


    return <div>
        <Typography variant="h5" gutterBottom >Run Function</Typography>
        <List style={{overflow: "scroll", height: "280px"}}>
            {content.map((it: any) => <ListItem key={it.uid}>
                <AutoDynamicView object={it} />
            </ListItem>)}
        </List>
    </div>
}
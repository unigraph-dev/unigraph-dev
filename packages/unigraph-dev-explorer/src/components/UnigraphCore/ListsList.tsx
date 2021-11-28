import { Card, Grid, Typography } from "@material-ui/core";
import { withUnigraphSubscription } from "../../unigraph-react";
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { List } from "@material-ui/icons";
import { onUnigraphContextMenu } from "../ObjectView/DefaultObjectContextMenu";
import { useDrop } from "react-dnd";

export const MiniListView = ({data}: any) => {
    const [{ isOver, canDrop }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: {uid: string, itemType: string}, monitor) => {
            window.unigraph.runExecutable('$/executable/add-item-to-list', {where: data.uid, item: item.uid})
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        })
    }))

    return <Grid item xs={12} sm={6} ref={dropSub}>
        <Card
            onContextMenu={(event) => onUnigraphContextMenu(event, data)}
            variant="outlined" style={{padding: "8px", display: "flex"}} 
            onClick={() => {window.wsnavigator(`/library/object?uid=${data.uid}&isStub=true&type=$/schema/list`)}}
        >
            <List style={{marginRight: "8px"}}/>
            <Typography>{data?.['_value']?.['name']?.['_value.%']} ({(data?.['_value']?.['children']?.items || 0).toString()})</Typography>
        </Card>
    </Grid>
}

export const ListsList = withUnigraphSubscription(({data}: any) => {
    return <div>
        <Grid container spacing={1}>
            {(data || []).map((el: any) => <MiniListView data={el}/>)}
        </Grid>
    </div>
}, {schemas: [], defaultData: [], packages: []}, {afterSchemasLoaded: (subsId, data, setData) => {
    const id = getRandomInt().toString();
    window.unigraph.subscribeToQuery(`(func: uid(lists${id})) @filter((NOT type(Deleted)) AND (NOT eq(<_hide>, true))) {
        uid
        _value {
			name {
				<_value.%>
            }
            children {
                items: count(<_value[>)
            }
        }
    }
var(func: eq(<unigraph.id>, "$/schema/list")) {
    <~type> {
        lists${id} as uid
    }
}`, (result: any) => {setData(result)}, subsId, true)
}})
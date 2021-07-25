import { Button, Typography } from "@material-ui/core"
import React from "react"
import { useEffectOnce } from "react-use";
import { download, upload } from "../../utils"; 

const getQuery = (name: string) => `(func: eq(<unigraph.id>, "${name}")) {
    uid
		objects: count(~type)
  }`

export const ConnectionWidget: React.FC = ({}) => {

    const [content, setContent]: any = React.useState({})
    const nsmap = Object.keys(window.unigraph?.getNamespaceMap?.() || {}).filter(el => el.startsWith('$/schema'));
    const [counts, setCounts] = React.useState<any[]>([])

    useEffectOnce(() => {
        window.unigraph.getStatus().then((st: any) => setContent(st))
        window.unigraph.getQueries(nsmap.map(el => getQuery(el))).then((res: any[]) => {
            setCounts(res.map((el, index) => [nsmap[index], el[0]?.['objects']]))
        })
    })


    return <div>
        <Typography variant="h5" gutterBottom >Unigraph Connection</Typography>
        <b>Graph DB Version </b> {content?.dgraph?.version} <br/>
        <b>Caches in memory </b> {JSON.stringify(content?.unigraph?.cache?.names)} <br/>
        <b>Total objects </b> {content?.dgraph?.objects} <br/>
        <b>Total schemas </b> {content?.dgraph?.schemas} <br/>
        <b>Total subscriptions </b> {content?.unigraph?.subscription?.length} <br/>
        <div>
            <Button onClick={() => upload((f: File) => {f.text().then((txt) => window.unigraph.importObjects(txt))})}>Import objects</Button> 
            <Button onClick={() => window.unigraph.subscribeToType('any', (data: any) => {download("unigraph_export_all.json", JSON.stringify(data))}, (new Date()).getTime(), {all: true})}>Export all objects</Button>
        </div>
        <b>Objects count</b> <br/>
        {counts.sort((a, b) => b[1] - a[1]).map(el => <div><b>{el[0]}</b> {el[1]}</div>)}
    </div>
}
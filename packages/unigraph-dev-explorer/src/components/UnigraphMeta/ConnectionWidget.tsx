import { Card, Chip, Typography } from "@material-ui/core"
import { LocalOffer } from "@material-ui/icons";
import React from "react"
import { useEffectOnce } from "react-use";
import { withUnigraphSubscription } from "unigraph-dev-common/lib/api/unigraph-react"
import { getContrast } from "../../utils";

export const ConnectionWidget: React.FC = ({}) => {

    const [content, setContent]: any = React.useState({})

    useEffectOnce(() => {
        window.unigraph.getStatus().then((st: any) => setContent(st))
    })


    return <div>
        <Typography variant="h5" gutterBottom >Unigraph Connection</Typography>
        <b>Graph DB Version </b> {content?.dgraph?.version} <br/>
        <b>Caches in memory </b> {JSON.stringify(content?.unigraph?.cache?.names)} <br/>
        <b>Total objects </b> {content?.dgraph?.objects} <br/>
        <b>Total schemas </b> {content?.dgraph?.schemas} <br/>
        <b>Total subscriptions </b> {content?.unigraph?.subscription?.length} <br/>

    </div>
}
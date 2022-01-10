import { Button, Typography } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { getRandomInt } from 'unigraph-dev-common/lib/api/unigraph';
import { download, upload } from '../../utils';

export const getStatsQuery = (name: string) => `(func: eq(<unigraph.id>, "${name}")) {
    uid
    objects: count(~type) @filter(type(Entity))
}`;

export const ConnectionWidget: React.FC = ({}) => {
    const [content, setContent]: any = React.useState({});
    const nsmap = Object.keys(window.unigraph?.getNamespaceMap?.() || {}).filter((el) => el.startsWith('$/schema'));
    const [counts, setCounts] = React.useState<any[]>([]);

    useEffectOnce(() => {
        window.unigraph.getStatus().then((st: any) => setContent(st));
        window.unigraph.getQueries(nsmap.map((el) => getStatsQuery(el))).then((res: any[]) => {
            setCounts(res.map((el, index) => [nsmap[index], el[0]?.objects]));
        });
    });

    return (
        <div style={{ overflowY: 'auto', height: '100%' }}>
            <Typography variant="h5" gutterBottom>
                Unigraph Connection
            </Typography>
            <b>Graph DB Version </b> {content?.dgraph?.version} <br />
            <b>Caches in memory </b> {JSON.stringify(content?.unigraph?.cache?.names)} <br />
            <b>Total objects </b> {content?.dgraph?.objects} <br />
            <b>Total schemas </b> {content?.dgraph?.schemas} <br />
            <b>Total subscriptions </b> {content?.unigraph?.subscription?.length} <br />
            <div>
                <Button
                    onClick={() => {
                        window.unigraph.getStatus().then((st: any) => setContent(st));
                        window.unigraph.getQueries(nsmap.map((el) => getStatsQuery(el))).then((res: any[]) => {
                            setCounts(res.map((el, index) => [nsmap[index], el[0]?.objects]));
                        });
                    }}
                >
                    Refresh
                </Button>
                <Button
                    onClick={() =>
                        upload((f: File) => {
                            f.text().then((txt) => window.unigraph.importObjects(txt));
                        })
                    }
                >
                    Import objects
                </Button>
            </div>
            <b>Objects count</b> <br />
            {counts
                .sort((a, b) => b[1] - a[1])
                .map((el, index) => (
                    <div key={index.toString()}>
                        <b>{el[0]}</b> {el[1]}
                    </div>
                ))}
        </div>
    );
};

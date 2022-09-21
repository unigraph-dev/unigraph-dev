import { OpenInFull } from '@mui/icons-material';
import { Card, Typography } from '@mui/material';
import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { AutoDynamicViewDetailed } from '../components/ObjectView/AutoDynamicViewDetailed';
import { registerDetailedDynamicViews } from '../unigraph-react';
import { TabContext } from '../utils';

type HomeSection = {
    header: string;
    content: React.ReactElement<any>;
    condition: () => Promise<boolean>;
};

function HomeSectionUnstable({ data }: any) {
    return data.get('view/maximize')?.as('primitive') ? (
        <AutoDynamicViewDetailed object={new UnigraphObject(data.get('view')._value)} />
    ) : (
        <>
            <Typography variant="h6" gutterBottom>
                {data.get('view/name').as('primitive')}
            </Typography>
            <AutoDynamicViewDetailed object={new UnigraphObject(data.get('view')._value)} />
        </>
    );
}

export const HomeSection = React.memo(HomeSectionUnstable, (prev, curr) => prev.uid === curr.uid);

export function HomeSectionFrame({ data, max }: any) {
    const [shouldDisplay, setShouldDisplay] = React.useState(false);
    const [flushCondition, setFlushCondition] = React.useState(true);
    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const fn = (newId: string) => {
            if (newId === 'home') setFlushCondition(true);
        };

        window.unigraph.getState('global/activeTab').subscribe(fn);

        return () => {
            window.unigraph.getState('global/activeTab').unsubscribe(fn);
        };
    }, []);

    React.useEffect(() => {
        const shouldRender = () => {
            if (tabContext.isVisible()) {
                window.unigraph.runExecutable(data.get('condition')._value.uid, {}).then((ret: any) => {
                    if (ret === true) setShouldDisplay(true);
                    else setShouldDisplay(false);
                });
            }
        };
        const int = setInterval(shouldRender, 1000 * 60);
        if (flushCondition) {
            shouldRender();
            setFlushCondition(false);
        }

        return function cleanup() {
            clearInterval(int);
        };
    }, [flushCondition]);

    // eslint-disable-next-line no-nested-ternary
    return shouldDisplay ? (
        <Card
            style={{
                margin: '12px',
                padding: !data.get('view/maximize')?.as('primitive') ? '16px' : '',
                flexGrow: 1,
            }}
            variant="outlined"
            onClick={() => {
                setTimeout(() => {
                    setFlushCondition(true);
                }, 500);
            }}
            className="unigraph-home-section"
        >
            <HomeSection data={data} />
        </Card>
    ) : (
        <span />
    );
}

export default function ExplorerHome({ id }: any) {
    const [sections, setSections] = React.useState<Partial<any>[]>([]);
    const [max, setMax] = React.useState();
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const subsId = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/home_section',
            (its: any[]) => {
                setSections(its);
            },
            subsId,
        );

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {sections.map((el) =>
                !max || max === el.uid ? (
                    <div style={{ display: 'flex', height: max ? '100%' : undefined }}>
                        <div
                            className={max ? '' : 'showOnHover'}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '14px',
                                height: '28px',
                                width: '28px',
                                padding: '4px',
                                position: 'absolute',
                                transform: 'translate(-36px, 20px)',
                            }}
                            onClick={() => {
                                if (!max) setMax(el.uid);
                                else setMax(undefined);
                            }}
                        >
                            <OpenInFull fontSize="small" style={{ opacity: 0.67 }} />
                        </div>
                        <HomeSectionFrame data={el} key={el.uid} max={!!max} />
                    </div>
                ) : null,
            )}
        </div>
    );
}

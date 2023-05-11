import { Grid, ListItemIcon, Typography, Box } from '@mui/material';
import Icon from '@mdi/react';
import { mdiFeatureSearchOutline, mdiAppsBox, mdiInboxOutline, mdiViewQuiltOutline } from '@mdi/js';
import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext, hoverSx } from '../../utils';

type AppShortcutProps = {
    avatar: React.ReactElement<any>;
    address: string;
    text: string;
};
// "const" casting bc of TS type-widening: https://mui.com/system/the-sx-prop/#typescript-usage
const appItemStyle = {
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    p: '10px',
    cursor: 'pointer',
    ...hoverSx,
} as const;

export function AppShortcut({ avatar, address, text }: AppShortcutProps) {
    return (
        <Box sx={appItemStyle} onClick={() => window.wsnavigator(address)}>
            <div className="mb-1.5 p-2 rounded-lg bg-indigo-50 ring-1 ring-gray-200 text-indigo-900">{avatar}</div>
            <span className="font-medium text-[13px] text-slate-600">{text}</span>
        </Box>
    );
}
export function AllApps() {
    const [totalViews, setTotalViews] = React.useState([]);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const viewId = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/view',
            (views: any) => {
                setTotalViews(views.filter((el: any) => el['unigraph.id']?.length > 0 || el._isShortcut === true));
            },
            viewId,
            { all: true },
        );

        return function cleanup() {
            tabContext.unsubscribe(viewId);
        };
    }, []);

    return (
        <Grid container spacing={2}>
            <Grid item xs={3} lg={1.5}>
                <AppShortcut
                    avatar={<Icon path={mdiFeatureSearchOutline} size={0.83} />}
                    address="/search"
                    text="Search"
                />
            </Grid>
            <Grid item xs={3} lg={1.5}>
                <AppShortcut avatar={<Icon path={mdiInboxOutline} size={0.83} />} address="/inbox" text="Inbox" />
            </Grid>
            {totalViews.map((el: any) => (
                <Grid item xs={3} lg={1.5} key={el.uid}>
                    <AppShortcut
                        avatar={
                            el?._value?.icon ? (
                                <ListItemIcon
                                    className="bg-indigo-900"
                                    style={{
                                        display: 'flex',
                                        minWidth: '20px',
                                        minHeight: '20px',
                                        WebkitMaskImage: `${
                                            el?._value?.icon?._value?.['_value.%']?.startsWith('data:image/svg+xml,')
                                                ? 'url("'
                                                : 'url("data:image/svg+xml,'
                                        }${el?._value?.icon?._value?.['_value.%']}")`,
                                        maskImage: `${
                                            el?._value?.icon?._value?.['_value.%']?.startsWith('data:image/svg+xml,')
                                                ? 'url("'
                                                : 'url("data:image/svg+xml,'
                                        }${el?._value?.icon?._value?.['_value.%']}")`,
                                    }}
                                />
                            ) : (
                                <Icon path={mdiViewQuiltOutline} size={1} />
                            )
                        }
                        address={`/${el?._value?.view?._value?.uid || el?._value?.view?.['_value.%']?.slice(7)}?icon=${
                            el?._value?.icon?._value?.['_value.%'] || ''
                        }`}
                        text={el?.get('name')?.as('primitive')}
                    />
                </Grid>
            ))}
            <Grid item xs={3} lg={1.5}>
                <AppShortcut avatar={<Icon path={mdiAppsBox} size={0.83} />} address="/app-library" text="All Apps" />
            </Grid>
        </Grid>
    );
}

export function AppLibraryWidget({}) {
    return (
        <div style={{ overflowY: 'auto', height: '100%' }}>
            <Typography variant="h5">Recommended Apps</Typography>
            <AllApps />
        </div>
    );
}

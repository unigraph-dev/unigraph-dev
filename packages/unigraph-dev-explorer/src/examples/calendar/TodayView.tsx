import { Button, Typography } from '@material-ui/core';
import React from 'react';
import Sugar from 'sugar';
import { UnigraphWidget } from '../../components/UnigraphCore/UnigraphWidget';
import { WidgetFocus } from './WidgetFocus';
import { WidgetPomodoro } from './WidgetPomodoro';

export function TodayView({ pageName }: any) {
    const pages = window.unigraph.getState('registry/pages');

    const [currentTime, setCurrentTime] = React.useState(new Date());
    React.useMemo(() => setInterval(() => setCurrentTime(new Date()), 1000), []);

    const [showInboxes, setShowInboxes] = React.useState(!pageName);

    console.log(pageName);
    return (
        <div style={{ display: 'flex', height: '100%', width: '100%' }}>
            <div
                style={{
                    maxWidth: '33%',
                    minWidth: '33%',
                    padding: '8px 16px 16px 8px',
                    display: 'flex',
                    height: '100%',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                <UnigraphWidget style={{ flex: 1 }}>
                    <div style={{ height: '120px' }}>
                        <Typography variant="h2">{Sugar.Date.format(currentTime, '{hh}:{mm}:{ss}')}</Typography>
                        <Typography variant="h6">{Sugar.Date.medium(currentTime)}</Typography>
                        <Button
                            onClick={() => {
                                setShowInboxes(!showInboxes);
                            }}
                        >
                            {showInboxes ? 'Hide inbox' : 'Show inbox'}
                        </Button>
                    </div>
                </UnigraphWidget>
                <div style={{ height: '16px' }} />
                <UnigraphWidget style={{ flex: 1 }}>
                    <WidgetPomodoro />
                </UnigraphWidget>
                <div style={{ height: '16px' }} />
                <UnigraphWidget style={{ flex: 1 }}>
                    <WidgetFocus />
                </UnigraphWidget>
            </div>
            {pageName ? <div style={{ width: '32px' }} /> : []}
            <div
                style={{
                    flexGrow: 1,
                    padding: '8px 16px 16px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: showInboxes ? 1 : 0,
                }}
            >
                <UnigraphWidget style={{ overflow: 'auto' }}>
                    <div style={{ flex: 1, height: '100%' }}>{pages.value.inbox.constructor()}</div>
                </UnigraphWidget>
                <div style={{ height: '16px' }} />
                <UnigraphWidget style={{ overflow: 'auto' }}>
                    <div style={{ flex: 1, height: '100%' }}>{pages.value['current-events'].constructor()}</div>
                </UnigraphWidget>
            </div>
        </div>
    );
}

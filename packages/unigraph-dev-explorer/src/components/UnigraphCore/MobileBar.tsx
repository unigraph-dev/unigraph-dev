import React from 'react';
import Icon from '@mdi/react';
import { mdiFormatIndentDecrease, mdiFormatIndentIncrease, mdiKeyboardReturn } from '@mdi/js';
import { isMobile } from '../../utils';

export const MobileBar = () => {
    const actionsState = window.unigraph.getState('global/focused/actions');
    const [focusedState, setFocusedState] = React.useState<any>();
    React.useEffect(() => {
        window.unigraph.getState('global/focused').subscribe(setFocusedState);
        return function cleanup() {
            window.unigraph.getState('global/focused').unsubscribe(setFocusedState);
        };
    }, []);

    return (
        <div
            style={{
                bottom: '0',
                zIndex: 99999,
                position: 'absolute',
                display: isMobile() && focusedState?.type === '$/schema/note_block' ? 'flex' : 'none',
                justifyContent: 'center',
                width: '100%',
            }}
        >
            <div
                onPointerDownCapture={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    actionsState.value?.unindentChild();
                }}
            >
                <Icon size={0.8} style={{ margin: '3px 8px' }} path={mdiFormatIndentDecrease} />
            </div>

            <div
                onPointerDownCapture={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    actionsState.value?.indentChild();
                }}
            >
                <Icon size={0.8} style={{ margin: '3px 8px' }} path={mdiFormatIndentIncrease} />
            </div>

            <div
                onPointerDownCapture={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    actionsState.value?.splitChild();
                }}
            >
                <Icon size={0.8} style={{ margin: '3px 8px' }} path={mdiKeyboardReturn} />
            </div>
        </div>
    );
};

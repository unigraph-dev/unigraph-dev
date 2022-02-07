import React from 'react';
import { TabContext } from '../../../utils';

export const useFocusDelegate = (uid: string, componentId: string) => {
    const tabContext = React.useContext(TabContext);
    const [isFocused, setIsFocused] = React.useState(
        window.unigraph.getState('global/focused').value.uid === uid && tabContext.isVisible(),
    );

    React.useEffect(() => {
        let hasFocus = false;
        const cbfoc = (foc: any) => {
            if (foc.uid === uid && tabContext.isVisible() && !foc?.component?.length) {
                hasFocus = true;
                window.unigraph.getState('global/focused').value.component = componentId;
            }
            if (
                foc.uid === uid &&
                tabContext.isVisible() &&
                window.unigraph.getState('global/focused').value.component === componentId
            )
                setIsFocused(true);
            else setIsFocused(false);
        };
        window.unigraph.getState('global/focused').subscribe(cbfoc);

        return function cleanup() {
            window.unigraph.getState('global/focused').unsubscribe(cbfoc);
        };
    }, [componentId, tabContext, uid]);

    return [
        isFocused,
        () => {
            const focused = window.unigraph.getState('global/focused');
            focused.setValue({ ...focused.value, component: '' });
        },
    ];
};

export const useSelectionDelegate = (uid: string, componentId: string) => {
    const tabContext = React.useContext(TabContext);
    const [isSelected, setIsSelected] = React.useState(false);

    React.useEffect(() => {
        const cbsel = (sel: any) => {
            if (sel?.includes?.(componentId)) setIsSelected(true);
            else setIsSelected(false);
        };
        window.unigraph.getState('global/selected').subscribe(cbsel);

        return function cleanup() {
            window.unigraph.getState('global/selected').unsubscribe(cbsel);
        };
    }, [componentId, tabContext, uid]);

    return [isSelected, () => false];
};

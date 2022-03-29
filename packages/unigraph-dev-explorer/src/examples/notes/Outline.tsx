/* eslint-disable react/require-default-props */
import React from 'react';
import { useDrag } from 'react-dnd';
import { colors } from '@mui/material';
import { styled } from '@mui/styles';
import { ChevronRight } from '@mui/icons-material';

import { DragHandle } from './DragHandle';
import { DataContext, TabContext } from '../../utils';
import { UnigraphObject } from './types';

const OutlineContainer = styled('div')({
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'baseline',
    position: 'relative',
    transition: 'transform 0.1s ease-in',
});

const controlStyles = {
    flex: '0 0 1rem',
    width: '1rem',
    height: '1rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const Bullet = styled('div')({
    ...controlStyles,
    position: 'relative',
    top: '0.125rem',
    '& > svg > circle': {
        transition: 'fill 0.1s ease-in',
    },
});

const Toggle = styled('button')({
    ...controlStyles,
    position: 'relative',
    top: '0.125rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderRadius: '50%',
    outline: 'none',
    margin: 0,
    padding: '0.1rem',
    fontSize: '1rem',
    transition: 'transform 0.1s ease-in, background 0.1s ease-in',
    '&:hover': {
        backgroundColor: colors.grey[200],
    },
});

const ChildrenLeftBorder = styled('div')({
    flex: '0 0 1px',
    height: 'calc(100% + 4px)',
    width: '1px',
    backgroundColor: colors.grey[300],
    position: 'absolute',
    left: 'calc(1.2rem - 0.5px)',
});

const ChildrenContainer = styled('div')({
    flexGrow: 1,
    marginLeft: '0.3rem',
    wordBreak: 'break-word',
});

interface OutlineProps {
    object: UnigraphObject;
    /** The index within its siblings. */
    index: number;
    children?: React.ReactNode;
    collapsed?: boolean;
    setCollapsed?: (val: boolean) => void;
    displayAs?: string;
    showCollapse?: boolean;
    parentDisplayAs?: string;
}

/** Hold the reference to the DOM of the content of an outline. */
export const OutlineContentContext = React.createContext<React.MutableRefObject<HTMLDivElement | null>>({
    current: null,
});

/** A container for both the content and its children. */
export function Outline({
    object,
    index,
    children,
    collapsed,
    setCollapsed,
    displayAs,
    showCollapse,
    parentDisplayAs,
}: OutlineProps) {
    const [hover, setHover] = React.useState(false);
    const rContentEl = React.useRef<HTMLDivElement>(null);
    const onPointerMove = React.useCallback((e: React.PointerEvent) => {
        const contentEl = rContentEl.current;
        if (!contentEl) return;
        const rect = contentEl.getBoundingClientRect();
        setHover(e.clientY > rect.top && e.clientY < rect.bottom);
    }, []);
    const onPointerLeave = React.useCallback(() => setHover(false), []);
    const toggleChildren = React.useCallback(() => setCollapsed && setCollapsed(!collapsed), [collapsed, setCollapsed]);

    const dataContext = React.useContext(DataContext);
    const tabContext = React.useContext(TabContext);
    const deleteOutline = React.useCallback(() => {
        console.log('removeFromContext', object);
    }, [object]);
    const [, setDragSource] = useDrag(
        () => ({
            type: object.type?.['unigraph.id'] || '$/schema/any',
            item: {
                uid: object.uid,
                itemType: object.type?.['unigraph.id'],
                dndContext: tabContext.viewId,
                dataContext: dataContext.contextUid,
                removeFromContext: deleteOutline,
            },
            collect: (monitor) => {
                if (monitor.isDragging() && window.dragselect) {
                    window.dragselect.break();
                }
                return {
                    isDragging: !!monitor.isDragging(),
                };
            },
            end: (item, monitor) => console.log('end drag', monitor.getDropResult()),
        }),
        [object?.type?.['unigraph.id'], object?.uid, tabContext.viewId, dataContext.contextUid],
    );

    return (
        <OutlineContainer
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            style={{
                transform: displayAs === 'outliner' ? 'translateX(-2rem)' : 'translateX(-2.3rem)',
                width: displayAs === 'outliner' ? 'calc(100% + 2rem)' : 'calc(100% + 2.3rem)',
            }}
        >
            <DragHandle
                ref={setDragSource}
                style={{
                    visibility: hover ? 'visible' : 'hidden',
                }}
            />
            <Toggle
                style={{
                    visibility: showCollapse && hover ? 'visible' : 'hidden',
                    transform: `rotate(${collapsed ? '0deg' : '90deg'})`,
                }}
                onClick={toggleChildren}
            >
                <ChevronRight fontSize="inherit" />
            </Toggle>
            {displayAs === 'outliner' && (
                <Bullet>
                    <svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" style={{ fill: collapsed ? colors.grey[200] : 'transparent' }} />
                        <circle cx="12" cy="12" r="4" style={{ fill: 'black' }} />
                    </svg>
                </Bullet>
            )}
            {displayAs === 'outliner' && (
                <ChildrenLeftBorder
                    style={{
                        display: parentDisplayAs === 'outliner' ? 'block' : 'none',
                    }}
                />
            )}
            <ChildrenContainer>
                <OutlineContentContext.Provider value={rContentEl}>{children}</OutlineContentContext.Provider>
            </ChildrenContainer>
        </OutlineContainer>
    );
}

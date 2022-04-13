/* eslint-disable react/require-default-props */
import React from 'react';
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { colors } from '@mui/material';
import { styled } from '@mui/styles';
import { ChevronRight } from '@mui/icons-material';

import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { DragHandle } from './DragHandle';
import { DataContext, TabContext } from '../../utils';
import { NoteEditorContext, UnigraphObject } from './types';
import { useOutlineCollapsed } from './useOutlineCollapsed';

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
    transition: 'transform 0.1s ease-in, background 30ms ease-in',
    '&:hover': {
        background: 'rgba(0, 0, 0, 0.08)',
    },
    '&:active': {
        background: 'rgba(0, 0, 0, 0.16)',
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

interface DropIndicatorProps {
    show: boolean;
}

const dropIndicatorHeight = 4;
/** @see https://mui.com/styles/basics/#adapting-the-styled-components-api */
const DropIndicator = styled(
    ({
        show,
        ...other
    }: DropIndicatorProps &
        Omit<
            React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
            keyof DropIndicatorProps
        >) => <div {...other} />,
)({
    position: 'absolute',
    left: '2rem',
    right: 0,
    height: dropIndicatorHeight,
    zIndex: -1,
    background: ({ show }) => (show ? 'rgba(63, 167, 223, 0.3)' : 'transparent'),
});

const DropIndicatorBefore = styled(DropIndicator)({
    top: -dropIndicatorHeight / 2,
});

const DropIndicatorAfter = styled(DropIndicator)({
    bottom: -dropIndicatorHeight / 2,
});

type DropHint = 'before' | 'after' | 'none';

/** Describe the object being dragged. */
interface DragObject {
    // FIXME: Don't pass noteBlock in here, find a way to get it via uid.
    noteBlock: UnigraphObject;
    /** The note block's uid. */
    uid: string;
    /** The parent note block's uid. */
    parentUid: string;
    /** The parent note block. */
    parent: UnigraphObject;
    /** For future global dnd. */
    itemType: string | undefined;
    /** For future global dnd. */
    tabId: number;
}

interface OutlineProps {
    noteBlock: UnigraphObject;
    parentNoteBlock?: UnigraphObject;
    /** The index within its siblings. */
    index: number;
    editorContext?: NoteEditorContext;
    children?: React.ReactNode;
    displayAs?: string;
    showCollapse?: boolean;
    parentDisplayAs?: string;
}

/** Get the uid of the "$/composer/array" object that holds children note blocks of a note block. */
function getChildrenComposerArrayUid(object: UnigraphObject): string | undefined {
    return object?._value?.children?.uid;
}

/** Check if `a` is a descendant of `b`, where `a` and `b` are note block objects. */
function isDescendantOf(a: UnigraphObject, b: UnigraphObject): boolean {
    if (a.uid === b.uid) return true;

    /** Check children note blocks if they exist. */
    const childrenOfB = b?._value?.children?.['_value['];
    if (childrenOfB && Array.isArray(childrenOfB)) {
        for (let i = 0; i < childrenOfB.length; i += 1) {
            const child = childrenOfB[i] as UnigraphObject;
            if (isDescendantOf(a, child)) return true;
        }
        return false;
    }

    /** Go down one more level to see if there are children note blocks. */
    if (b?._value) return isDescendantOf(a, b._value);

    /** Nothing to do, declare not found. */
    return false;
}

/** Hold the reference to the DOM of the content of an outline. */
export const OutlineContentContext = React.createContext<React.MutableRefObject<HTMLDivElement | null>>({
    current: null,
});

/** An outline item. */
export function Outline({
    noteBlock,
    parentNoteBlock,
    index,
    editorContext,
    children,
    displayAs,
    showCollapse,
    parentDisplayAs,
}: OutlineProps) {
    const [hover, setHover] = React.useState(false);
    const rOutlineEl = React.useRef<HTMLDivElement>(null);
    const rContentEl = React.useRef<HTMLDivElement>(null);
    const onPointerMove = React.useCallback((e: React.PointerEvent) => {
        const contentEl = rContentEl.current;
        if (!contentEl) return;
        const rect = contentEl.getBoundingClientRect();
        setHover(e.clientY > rect.top && e.clientY < rect.bottom);
    }, []);
    const onPointerLeave = React.useCallback(() => setHover(false), []);
    const [isCollapsed, toggleCollapsed] = useOutlineCollapsed(noteBlock.uid);

    const dataContext = React.useContext(DataContext);
    const tabContext = React.useContext(TabContext);
    const dndType = 'outliner-dnd';

    const [, setDragSource, setDragPreview] = useDrag<DragObject, unknown, unknown>(
        () => ({
            type: dndType,
            item: {
                noteBlock,
                uid: noteBlock.uid,
                parentUid: dataContext.contextUid,
                parent: dataContext.contextData,
                itemType: noteBlock.type?.['unigraph.id'],
                tabId: tabContext.viewId,
            },
            collect: (monitor) => {
                if (monitor.isDragging() && window.dragselect && window.dragselect.isDragging()) {
                    /** Disable selection box. */
                    window.dragselect.stop();
                }
                return {
                    isDragging: !!monitor.isDragging(),
                };
            },
            end: () => {
                if (window.dragselect) {
                    /** Enable selection box. */
                    window.dragselect.start();
                }
            },
        }),
        [noteBlock, dataContext.contextUid, tabContext.viewId],
    );

    const canDrop = React.useCallback(
        (item: DragObject) => {
            /** Prevent dropping a note block into its own descendant note blocks. */
            return !!parentNoteBlock && !isDescendantOf(parentNoteBlock, item.noteBlock);
        },
        [parentNoteBlock],
    );

    const onCollect = React.useCallback((monitor: DropTargetMonitor<DragObject>): DropHint => {
        if (!monitor.canDrop()) return 'none';

        const outlineEl = rOutlineEl.current;
        if (!outlineEl) return 'none';

        /** The rectangle of the hovered outline. */
        const hoverBoundingRect = outlineEl.getBoundingClientRect();

        /** Get vertical middle. */
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        /** Determine mouse position. */
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return 'none';

        /** Get pixels to the rectangle's top. */
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        /** Don't be greedy. @see https://react-dnd.github.io/react-dnd/examples/nesting/drop-targets */
        if (!monitor.isOver({ shallow: true })) {
            return 'none';
        }

        /** Infer intention. */
        if (hoverClientY < hoverMiddleY) {
            return 'before';
        }

        if (hoverClientY > hoverMiddleY) {
            return 'after';
        }

        return 'none';
    }, []);

    const performDrop = React.useCallback(
        (item: DragObject, side: 'before' | 'after') => {
            console.log('drop', item.uid, 'from', item.parentUid, 'to', parentNoteBlock?.uid, `${side} index`, index);
            /**
             * Use `reorderItemInArray` if drag and drop in the same array, to prevent
             * wrong result due to add-then-remove race condition.
             */
            if (item.parentUid === parentNoteBlock?.uid) {
                const arrayUid = getChildrenComposerArrayUid(parentNoteBlock);
                if (!arrayUid) return;
                const realIndex = side === 'after' ? index : index - 1;
                const fromIndex = (parentNoteBlock?._value?.children?.['_value['] || []).filter(
                    (obj: any) => obj._value._value.uid === item.uid,
                )[0]?._index?.['_value.#i'];
                const toInsert = parentNoteBlock?._value?.children?.['_value[']
                    .map((el: any) => el._value._value.uid)
                    .filter((el: any) => el !== item.uid);
                toInsert.splice(fromIndex < realIndex ? realIndex : realIndex + 1, 0, item.uid);
                const t = {
                    children: {
                        '_value[': (parentNoteBlock?._value?.children?.['_value['] || []).map((child: any) => ({
                            _index: {
                                '_value.#i': toInsert.indexOf(child._value._value.uid),
                            },
                            _key: child._key,
                            _value: { uid: child._value.uid },
                        })),
                        _displayAs: parentNoteBlock?._value?.children?._displayAs,
                    },
                };
                // send fake update now
                window.unigraph.updateObject(
                    parentNoteBlock?._value?.uid,
                    t,
                    false,
                    false,
                    editorContext?.callbacks?.subsId,
                    [],
                    true,
                );
            } else {
                const targetNoteBlockUid = parentNoteBlock?.uid;
                if (!targetNoteBlockUid) return;
                const realIndex = side === 'after' ? index + 1 : index;
                const subEntities = (parentNoteBlock?._value?.children?.['_value['] || []).filter(
                    (child: any) => child?._value?.type['unigraph.id'] === '$/schema/subentity',
                );
                let entityIndex = subEntities[realIndex]?._index?.['_value.#i'];
                if (entityIndex === undefined) entityIndex = parentNoteBlock?._value?.children?.['_value['].length;

                // if (parentNoteBlock && isDescendantOf(parentNoteBlock, item.noteBlock)) return;
                window.unigraph.updateObject?.(
                    item.parent._value.uid,
                    {
                        children: {
                            _displayAs: item.parent._value.children._displayAs,
                            '_value[': item.parent._value.children['_value[']
                                .filter((el: any) => el._value._value.uid !== item.uid)
                                .map((el: any, indexx: number) => ({
                                    _index: {
                                        '_value.#i': indexx,
                                    },
                                    _key: el._key,
                                    _value: { uid: el._value.uid },
                                })),
                        },
                    },
                    false,
                    false,
                    editorContext?.callbacks?.subsId,
                    [],
                    true,
                );
                window.unigraph.updateObject(
                    parentNoteBlock?._value?.uid,
                    {
                        children: {
                            '_value[': [
                                ...(parentNoteBlock?._value?.children?.['_value['] || []).map((child: any) => ({
                                    _index: {
                                        '_value.#i':
                                            child._index?.['_value.#i'] < entityIndex
                                                ? child._index['_value.#i']
                                                : child._index['_value.#i'] + 1,
                                    },
                                    _key: child._key,
                                    _value: { uid: child._value.uid },
                                })),
                                {
                                    _index: {
                                        '_value.#i': entityIndex,
                                    },
                                    _value: {
                                        type: { 'unigraph.id': '$/schema/subentity' },
                                        _value: { uid: item.uid },
                                    },
                                },
                            ],
                        },
                    },
                    false,
                    false,
                    editorContext?.callbacks?.subsId,
                    [],
                    true,
                );
            }
        },
        [parentNoteBlock, index],
    );

    const onDrop = React.useCallback(
        (item: DragObject, monitor: DropTargetMonitor<DragObject>) => {
            const intent = onCollect(monitor);
            if (intent !== 'none') performDrop(item, intent);
        },
        [onCollect, performDrop],
    );

    const [dropHint, setDropTarget] = useDrop<DragObject, unknown, DropHint>(
        () => ({
            accept: [dndType],
            canDrop,
            collect: onCollect,
            drop: onDrop,
        }),
        [canDrop, onCollect, onDrop],
    );

    /**
     * Use the whole outline as the drop target and infer the action based
     * on the mouse position. Inspired by the "Sortable" examples
     * (https://react-dnd.github.io/react-dnd/examples/sortable/simple).
     */
    setDropTarget(rOutlineEl);

    return (
        <OutlineContainer
            ref={rOutlineEl}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            style={{
                /** Make room for drag handle and toggle. */
                transform: displayAs === 'outliner' ? 'translateX(-2rem)' : 'translateX(-2.3rem)',
                width: displayAs === 'outliner' ? 'calc(100% + 2rem)' : 'calc(100% + 2.3rem)',
            }}
        >
            <DragHandle
                ref={setDragSource}
                style={{
                    visibility: hover ? 'visible' : 'hidden',
                    transform: 'translateY(0.2rem)', // visual fine tune
                }}
            />
            <Toggle
                style={{
                    visibility: showCollapse && hover ? 'visible' : 'hidden',
                    transform: `rotate(${isCollapsed ? '0deg' : '90deg'})`,
                }}
                onClick={toggleCollapsed}
            >
                <ChevronRight fontSize="inherit" />
            </Toggle>
            {displayAs === 'outliner' && (
                <Bullet>
                    <svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            style={{ fill: isCollapsed ? colors.grey[200] : 'transparent' }}
                        />
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
            <ChildrenContainer ref={setDragPreview}>
                <OutlineContentContext.Provider value={rContentEl}>{children}</OutlineContentContext.Provider>
            </ChildrenContainer>
            <DropIndicatorAfter show={dropHint === 'after'} />
            <DropIndicatorBefore show={dropHint === 'before'} />
        </OutlineContainer>
    );
}

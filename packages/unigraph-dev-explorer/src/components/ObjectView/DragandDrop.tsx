import { Slide } from '@material-ui/core';
import React from 'react';
import { useDrop } from 'react-dnd';

export function BelowDropAcceptor({ onDrop, isReverse, style }: any) {
    const [{ shouldShow }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: isReverse ? () => false : onDrop,
        collect: (monitor) => ({
            shouldShow: !!monitor.isOver() && !isReverse,
        }),
    }));

    return (
        <div
            ref={dropSub}
            style={{
                opacity: shouldShow ? 1 : 0,
                width: '100%',
                height: '10px',
                marginTop: '-5px',
                ...style,
            }}
        >
            <div
                style={{
                    height: '80%',
                    marginTop: '10%',
                    backgroundColor: 'gray',
                    margin: '0px',
                    borderRadius: '4px',
                }}
            />
        </div>
    );
}

const onDrop = (dndContext: any, listId: any, arrayId: any, index: any, dropperProps: any) => {
    console.log(dropperProps, listId, 'a', dndContext, index);
    console.log(index);
    if (dndContext && listId && dndContext === dropperProps?.dndContext && listId === dropperProps?.dataContext) {
        // If both are in the same list - should just reorder
        window.unigraph.reorderItemInArray?.(arrayId, [dropperProps.uid, index], undefined, undefined);
    } else if (dndContext === dropperProps?.dndContext) {
        // Same DnD context but not same list - should insert and then delete
        window.unigraph
            .runExecutable('$/executable/add-item-to-list', {
                where: listId,
                item: dropperProps.uid,
                indexes: [index],
            })
            .then(() => {
                dropperProps.removeFromContext();
            });
    } else {
        // Different DnD context - should just insert
        window.unigraph.runExecutable('$/executable/add-item-to-list', {
            where: listId,
            item: dropperProps.uid,
            indexes: [index],
        });
    }
};

export function DragandDrop({
    children,
    style = {},
    dndContext,
    listId,
    arrayId,
    isReverse,
    Comp = React.Fragment,
    ChildrenComp = React.Fragment,
}: any) {
    return (
        <Comp>
            {children.map((child: any, index: number) => (
                <ChildrenComp key={`${child.key || index}`}>
                    <div key={`${child.key || index}_dropper`}>
                        {child}
                        <BelowDropAcceptor
                            onDrop={(props: any) => {
                                console.log(dndContext, listId, arrayId, index, props);
                                onDrop(dndContext, listId, arrayId, index, props);
                            }}
                            isReverse={isReverse}
                            key={`${child.key || index}_dropacceptor`}
                            style={style}
                        />
                    </div>
                </ChildrenComp>
            ))}
        </Comp>
    );
}

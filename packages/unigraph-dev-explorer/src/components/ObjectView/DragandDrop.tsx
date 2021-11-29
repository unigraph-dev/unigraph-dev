import React from "react"
import { useDrop } from "react-dnd"

export const BelowDropAcceptor = ({ onDrop, isReverse }: any) => {
    const [{ isOver, canDrop }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: isReverse ? () => {} : onDrop,
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        })
    }))

    return <div ref={dropSub} style={{opacity: (canDrop && isOver && !isReverse) ? 1 : 0, width: "100%", height: "10px", marginTop: "-5px"}}>
        <div style={{height: "60%", marginTop: "20%", backgroundColor: "gray", margin: "0px", borderRadius: "4px"}}/>
    </div>
}

export const WithDropBelow = ({children, onDrop, isReverse}: any) => {
    return <React.Fragment>
        {children}
        <BelowDropAcceptor onDrop={onDrop} isReverse={isReverse} />
    </React.Fragment>
}

const onDrop = (dndContext: any, listId: any, arrayId: any, index: any, dropperProps: any) => {
    console.log(dropperProps, listId, dndContext, index);
    if (dndContext && listId && dndContext === dropperProps?.dndContext && listId === dropperProps?.dataContext) {
        // If both are in the same list - should just reorder
        window.unigraph.reorderItemInArray?.(arrayId, [dropperProps.uid, index], undefined, undefined);
    } else if (dndContext === dropperProps?.dndContext) {
        // Same DnD context but not same list - should insert and then delete
        window.unigraph.runExecutable('$/executable/add-item-to-list', {where: arrayId, item: dropperProps.uid, indexes: [index]}).then(() => {
            dropperProps.removeFromContext();
        })
    } else {
        // Different DnD context - should just insert
        window.unigraph.runExecutable('$/executable/add-item-to-list', {where: arrayId, item: dropperProps.uid, indexes: [index]})
    }
}

export const DragandDrop = ({children, style = {}, dndContext, listId, arrayId, isReverse}: any) => {
    <BelowDropAcceptor onDrop={onDrop.bind(this, dndContext, listId, -1)} isReverse={isReverse}/>
    return <div style={{...style}}>
        {children.map((child: any, index: number) => <WithDropBelow children={child} onDrop={onDrop?.bind(this, dndContext, listId, arrayId, index)} isReverse={isReverse}/>)}
    </div>
}

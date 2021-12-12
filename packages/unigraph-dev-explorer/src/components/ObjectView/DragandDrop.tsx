import React from "react"
import { useDrop } from "react-dnd"

export const BelowDropAcceptor = ({ onDrop, isReverse, style }: any) => {
    const [{ shouldShow }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: isReverse ? () => {} : onDrop,
        collect: (monitor) => ({
            shouldShow: !!monitor.isOver() && !isReverse
        })
    }))

    return <div ref={dropSub} style={{opacity: shouldShow ? 1 : 0, width: "100%", height: "10px", marginTop: "-5px", ...style}}>
        <div style={{height: "80%", marginTop: "10%", backgroundColor: "gray", margin: "0px", borderRadius: "4px"}}/>
    </div>
}

export const WithDropBelow = ({children, onDrop, isReverse, style, index}: any) => {
    return <React.Fragment>
        {children}
        <BelowDropAcceptor onDrop={onDrop} isReverse={isReverse} key={index + "_dropacceptor"} style={style} />
    </React.Fragment>
}

const onDrop = (dndContext: any, listId: any, arrayId: any, index: any, dropperProps: any) => {
    console.log(dropperProps, listId, "a", dndContext, index);
    console.log(index)
    if (dndContext && listId && dndContext === dropperProps?.dndContext && listId === dropperProps?.dataContext) {
        // If both are in the same list - should just reorder
        window.unigraph.reorderItemInArray?.(arrayId, [dropperProps.uid, index], undefined, undefined);
    } else if (dndContext === dropperProps?.dndContext) {
        // Same DnD context but not same list - should insert and then delete
        window.unigraph.runExecutable('$/executable/add-item-to-list', {where: listId, item: dropperProps.uid, indexes: [index]}).then(() => {
            dropperProps.removeFromContext();
        })
    } else {
        // Different DnD context - should just insert
        window.unigraph.runExecutable('$/executable/add-item-to-list', {where: listId, item: dropperProps.uid, indexes: [index]})
    }
}

export const DragandDrop = ({children, style = {}, dndContext, listId, arrayId, isReverse}: any) => {
    return <div>
        <BelowDropAcceptor onDrop={onDrop.bind(this, dndContext, listId, arrayId, -1)} isReverse={isReverse} style={style}/>
        {children.map((child: any, index: number) => <WithDropBelow index={index} style={style} children={child} onDrop={(props: any) => {console.log(dndContext, listId, arrayId, index, props); onDrop(dndContext, listId, arrayId, index, props)}} isReverse={isReverse} key={index + "_dnd"}/>)}
    </div>
}

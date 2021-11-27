import { useDrop} from 'react-dnd';

export const isStub = (object: any) =>
    (typeof object === "object" && object.uid && object.type && typeof object.type['unigraph.id'] === "string" && typeof object.type['unigraph.id'].startsWith('$/') 
        && ((Object.keys(object).length === 3 && object['_stub']) || (Object.keys(object).filter(el => el.startsWith('_value')).length === 0)) )

export const SubentityDropAcceptor = ({ uid }: any) => {
    const [{ isOver, canDrop }, dropSub] = useDrop(() => ({
        // @ts-expect-error: already checked for namespace map
        accept: Object.keys(window.unigraph.getNamespaceMap() || {}),
        drop: (item: {uid: string, itemType: string}, monitor) => {
            if (!monitor.didDrop() && item.uid !== uid) {
                window.unigraph.updateObject(uid, {
                    children: [{
                        type: {"unigraph.id": "$/schema/subentity"},
                        _value: {
                            //"type": {"unigraph.id": item.itemType},
                            uid: item.uid
                        }
                    }]
                })
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        })
    }))

    const opacities: Record<string, number> = {"truetrue": 1, "truefalse": 0.5, "falsefalse": 0, "falsetrue": 0}

    return <div ref={dropSub} style={{opacity: opacities[canDrop + "" + isOver], width: "100%", height: canDrop ? "16px" : "0px", margin: "0px"}}>
        <hr style={{height: "50%", backgroundColor: "gray", margin: "0px", marginLeft: "48px"}}/>
    </div>
}

export const getSubentities = (data: any) => {
    return data?._value?.children?.['_value[']?.map?.((el: any) => el['_value']).filter((el: any) => el.type['unigraph.id'] === "$/schema/subentity") 
}
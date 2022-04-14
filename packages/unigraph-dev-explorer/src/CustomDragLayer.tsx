import React from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { DragHandle } from './examples/notes/DragHandle';

const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
};

function getItemStyles(initialOffset: XYCoord | null, currentOffset: XYCoord | null) {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        };
    }

    const { x, y } = currentOffset;

    const transform = `translate(${x}px, ${y}px)`;
    return {
        transform,
        WebkitTransform: transform,
    };
}

export const CustomDragLayer = () => {
    const { isDragging, initialOffset, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    React.useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = 'grabbing';
        } else {
            document.body.style.cursor = 'auto';
        }
    }, [isDragging]);

    if (!isDragging) {
        return null;
    }
    return (
        <div style={layerStyles}>
            <div style={getItemStyles(initialOffset, currentOffset)}>
                <DragHandle />
            </div>
        </div>
    );
};

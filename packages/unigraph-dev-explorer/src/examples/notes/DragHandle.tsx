/* eslint-disable react/require-default-props */
import { styled } from '@mui/styles';
import React from 'react';

const DragHandleContainer = styled('div')({
    flex: '0 0 1rem',
    width: '1rem',
    height: '1.2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: '0.25rem',
    transition: 'background 30ms ease-in',
    '&:hover': {
        background: 'rgba(0, 0, 0, 0.1)',
    },
    '&:active': {
        background: 'rgba(0, 0, 0, 0.2)',
    },
});

export const DragHandle = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>((props, ref) => {
    return (
        <DragHandleContainer ref={ref} {...props}>
            <svg width="100%" height="100%" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7" r="1.5" />
                <circle cx="7" cy="12" r="1.5" />
                <circle cx="7" cy="17" r="1.5" />
                <circle cx="13" cy="7" r="1.5" />
                <circle cx="13" cy="12" r="1.5" />
                <circle cx="13" cy="17" r="1.5" />
            </svg>
        </DragHandleContainer>
    );
});

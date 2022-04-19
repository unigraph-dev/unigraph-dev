import { useCallback } from 'react';
import create from 'zustand';
import { persist } from 'zustand/middleware';

type CollapsedMap = Record<string, boolean>;

interface Store {
    collapsedMap: CollapsedMap;
    toggle: (noteBlockUid: string) => void;
}

/** For persistence in localStorage. */
const COLLAPSED_MAP_KEY = 'noteblockCollapsedByUid';

/**
 * Manage collapsed state of note blocks.
 * @see https://github.com/pmndrs/zustand#persist-middleware
 */
const useOutlineCollapsedMap = create<Store>(
    persist(
        (set) => ({
            collapsedMap: {},
            toggle: (noteBlockUid) =>
                set((state) => {
                    const newCollapsedMap = {
                        ...state.collapsedMap,
                        [noteBlockUid]: !state.collapsedMap[noteBlockUid],
                    };
                    return {
                        collapsedMap: newCollapsedMap,
                    };
                }),
        }),
        { name: COLLAPSED_MAP_KEY },
    ),
);

/** Return value: `[isCollapsed, toggleCollapsed]`. */
export function useOutlineCollapsed(noteBlockUid: string): [boolean, () => void] {
    const isCollapsed = useOutlineCollapsedMap(
        useCallback((state) => state.collapsedMap[noteBlockUid], [noteBlockUid]),
    );
    const toggleCollapsed = useOutlineCollapsedMap(
        useCallback((state) => () => state.toggle(noteBlockUid), [noteBlockUid]),
    );
    return [isCollapsed, toggleCollapsed];
}

export function isNoteBlockCollapsed(noteBlockUid: string): boolean {
    return useOutlineCollapsedMap.getState().collapsedMap[noteBlockUid];
}

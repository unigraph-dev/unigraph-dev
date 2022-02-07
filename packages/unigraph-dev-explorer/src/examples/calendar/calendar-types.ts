import { Event } from 'react-big-calendar';
import { UnigraphObject } from 'unigraph-dev-common/lib/types/unigraph';

export interface CalendarViewEvent extends Event {
    unigraphObj: UnigraphObject;
}

export type TodoUni = any;
export type CalendarEventUni = any;
export type JournalUni = any;
export type DatedObject = TodoUni | CalendarEventUni | JournalUni;

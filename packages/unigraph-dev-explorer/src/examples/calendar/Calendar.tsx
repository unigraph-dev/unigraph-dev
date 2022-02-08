import { Avatar, Typography } from '@material-ui/core';
import React from 'react';
import { buildGraph, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import Sugar from 'sugar';
import { unionBy, isString, has, flow, propEq, curry, unionWith } from 'lodash/fp';
import { Calendar as BigCalendar, DateLocalizer, momentLocalizer, stringOrDate, View } from 'react-big-calendar';
import moment from 'moment';
import {} from 'lodash';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { getDateAsUTC, TabContext } from '../../utils';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarViewEvent, TodoUni, CalendarEventUni, JournalUni, DatedObject } from './calendar-types';

export function CalendarEvent({ data, callbacks, inline }: any) {
    const CalendarColor = (
        <div style={{ alignSelf: 'center', marginRight: inline ? '8px' : '16px' }}>
            <Avatar
                style={{
                    width: inline ? 8 : 16,
                    height: inline ? 8 : 16,
                    backgroundColor: data.get('calendar/color')?.as?.('primitive'),
                }}
            >
                {' '}
            </Avatar>
        </div>
    );
    //
    const renderInline = () => {
        return (
            <div style={{ display: 'flex' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {CalendarColor}
                        <Typography variant="body1" style={{ marginRight: '8px' }}>
                            {data.get('name').as('primitive')}
                        </Typography>
                        <Typography variant="body2" style={{ color: 'gray' }}>
                            {data.get('location').as('primitive')}
                        </Typography>
                    </div>
                    <div
                        style={{
                            display: data?._value?.children?.['_value[']?.map ? '' : 'none',
                            marginTop: '0px',
                        }}
                    >
                        {data?._value?.children?.['_value[']?.map
                            ? data._value.children['_value['].map((it: any) => (
                                  <AutoDynamicView
                                      object={new UnigraphObject(it._value)}
                                      callbacks={callbacks}
                                      options={{ inline: true }}
                                      style={{ verticalAlign: 'middle' }}
                                  />
                              ))
                            : []}
                    </div>
                </div>
            </div>
        );
    };

    const render = () => {
        return (
            <div style={{ display: 'flex' }}>
                {CalendarColor}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" style={{ marginRight: '8px' }}>
                            <strong>{data.get('name').as('primitive')}</strong>
                        </Typography>
                        <Typography variant="body2" style={{ color: 'gray' }}>
                            {data.get('location').as('primitive')}
                        </Typography>
                    </div>
                    <AutoDynamicView
                        object={new UnigraphObject(data.get('time_frame')._value)}
                        callbacks={callbacks}
                        options={{ noDrag: true, noDrop: true, noContextMenu: true, inline: true }}
                    />
                    <div
                        style={{
                            display: data?._value?.children?.['_value[']?.map ? '' : 'none',
                            marginTop: '4px',
                        }}
                    >
                        {data?._value?.children?.['_value[']?.map
                            ? data._value.children['_value['].map((it: any) => (
                                  <AutoDynamicView
                                      object={new UnigraphObject(it._value)}
                                      callbacks={callbacks}
                                      options={{ inline: true }}
                                      style={{ verticalAlign: 'middle' }}
                                  />
                              ))
                            : []}
                    </div>
                </div>
            </div>
        );
    };

    return inline ? renderInline() : render();
}

export function TimeFrame({ data, callbacks }: any) {
    return (
        <span>
            {callbacks?.noDate ? '' : `${Sugar.Date.medium(new Date(data.get('start/datetime').as('primitive')))}, `}
            {`${Sugar.Date.format(new Date(data.get('start/datetime').as('primitive')), '{h}:{mm}%P')} - `}
            {Sugar.Date.format(new Date(data.get('end/datetime').as('primitive')), '{h}:{mm}%P')}
        </span>
    );
}

const queryDatedWithinTimeRange = (start: string, end: string) => {
    return `calendarObjs(func: uid(calendarObjs)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @recurse(depth:8){ 
        uid
        <unigraph.id> 
        expand(_userpredicate_) 
    }
   timepoints(func: eq(<unigraph.id>, "$/schema/time_point")) {
        <~type> {
            timepointUids as uid
        }
    }
    # get timepoint uids with datetime value var
    timepointsInRange as var(func: uid(timepointUids) )@cascade{
      _value {
        # datetime {
        datetime @filter(ge(<_value.%dt>, "${start}") AND le(<_value.%dt>, "${end}")) {
          # datetime_datetime as <_value.%dt>
          <_value.%dt>
        }
      }					 
    }
    # objects that reference timepoints. Found through timepoint's backlinks in unigraph.origin     
    findTimedObjects(func: uid(timepointsInRange)){ 
      <unigraph.origin>{
                    timedObjs as uid
        }
    }  

      
    # Get uids of dated objects that aren't timepoints or timeframes. E.g. events and daily notes
    calendarObjs as var(func: uid(timedObjs)) @cascade{ 
      type @filter(NOT (eq(<unigraph.id>, "$/schema/time_point") OR eq(<unigraph.id>, "$/schema/time_frame") )) @cascade {
        <unigraph.id>
      }
    }`;
};

const todoToBigCalendarEvent = (datedObj: TodoUni): CalendarViewEvent => {
    return {
        title: datedObj.get('name').as('primitive'),
        start: new Date(datedObj.get('time_frame/start/datetime').as('primitive')),
        end: new Date(datedObj.get('time_frame/end/datetime').as('primitive')),
        allDay: true,
        unigraphObj: datedObj,
    };
};

const journalToBigCalendarEvent = (datedObj: JournalUni): CalendarViewEvent => {
    return {
        title: datedObj.get('note/text').as('primitive'),
        start: getDateAsUTC(datedObj.get('date/datetime').as('primitive')),
        end: getDateAsUTC(datedObj.get('date/datetime').as('primitive')),
        allDay: true,
        unigraphObj: datedObj,
    };
};

const calendarEventToBigCalendarEvent = (datedObj: CalendarEventUni): CalendarViewEvent => {
    return {
        title: datedObj.get('name').as('primitive'),
        start: new Date(datedObj.get('time_frame/start/datetime').as('primitive')),
        end: new Date(datedObj.get('time_frame/end/datetime').as('primitive')),
        unigraphObj: datedObj,
    };
};

type CalendarViewRange = { start: Date; end: Date };

const recurrentCalendarEventToBigCalendarEventsInRange = curry(
    (range: CalendarViewRange | null, datedObj: DatedObject): CalendarViewEvent[] => {
        const timeframes = datedObj.get('recurrence')?.['_value['];
        if (timeframes?.length) {
            return buildGraph(timeframes)
                .filter((timeframe) => {
                    // filter not in our view time range
                    if (!range) {
                        return true;
                    }
                    const afterStart = new Date(timeframe.get('end/datetime').as('primitive')) >= range.start;
                    const beforeEnd = new Date(timeframe.get('start/datetime').as('primitive')) <= range.end;
                    return afterStart && beforeEnd;
                })
                .map((timeframe: any) => {
                    return {
                        title: datedObj.get('name').as('primitive'),
                        start: new Date(timeframe.get('start/datetime').as('primitive')),
                        end: new Date(timeframe.get('end/datetime').as('primitive')),
                        unigraphObj: datedObj,
                    };
                });
        }
        return [calendarEventToBigCalendarEvent(datedObj)];
    },
);

// const recurrentCalendarEventToBigCalendarEvents = recurrentCalendarEventToBigCalendarEventsInRange(null);

const wrapInArray = (obj: any) => {
    if (obj) {
        return [obj];
    }
    return [];
};

const datedToBigCalendarEventsInRange = curry(
    (range: CalendarViewRange | null, datedObj: DatedObject): CalendarViewEvent[] => {
        const bigCalendarEventsByType: any = {
            '$/schema/todo': flow(todoToBigCalendarEvent, wrapInArray),
            '$/schema/journal': flow(journalToBigCalendarEvent, wrapInArray),
            '$/schema/calendar_event': recurrentCalendarEventToBigCalendarEventsInRange(range),
            // '$/schema/calendar_event': flow(calendarEventToBigCalendarEvent, wrapInArray),
        };
        return bigCalendarEventsByType[datedObj.getType()](datedObj);
    },
);

// const datedToBigCalendarEvents = datedToBigCalendarEventsInRange(null);

const unigraphBigCalendarEventComponent = ({ event, ...props }: any) => {
    return (
        <AutoDynamicView
            object={new UnigraphObject(event.unigraphObj)}
            options={{ inline: true }}
            callbacks={{ noDate: true, isEmbed: true }}
        />
    );
};

const getCurrentWeekStart = (today: Date) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
};
const getCurrentWeekEnd = (today: Date) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
};

const compareCalendarViewEvents = (a: CalendarViewEvent, b: CalendarViewEvent) => {
    const sameStart = `${a.start}` === `${b.start}`;
    const sameUid = a.unigraphObj.uid === b.unigraphObj.uid;
    return sameUid && sameStart;
};

export function Calendar() {
    const [currentEvents, setCurrentEvents] = React.useState<CalendarViewEvent[]>([]);
    const [localizer, _] = React.useState<DateLocalizer>(() => momentLocalizer(moment));
    const [currentView, setCurrentView] = React.useState<View | undefined>('week');
    const [viewRange, setViewRange] = React.useState<CalendarViewRange>({
        start: getCurrentWeekStart(new Date()),
        end: getCurrentWeekEnd(new Date()),
    });
    const tabContext = React.useContext(TabContext);
    const addToCurrentEvents = React.useCallback(
        (newEvents: CalendarViewEvent[]) => {
            const updatedCurrentEvents = unionWith(compareCalendarViewEvents, newEvents, currentEvents);
            // console.log('updatedCurrentEvents', {
            //     updatedCurrentEventsLen: updatedCurrentEvents.length,
            //     newEventsLen: newEvents.length,
            //     currentEventsLen: currentEvents.length,
            //     newEvents,
            //     currentEvents,
            //     updatedCurrentEvents,
            // });
            setCurrentEvents(updatedCurrentEvents);
        },

        [currentEvents],
    );

    React.useEffect(() => {
        const id = getRandomInt();
        tabContext.subscribeToQuery(
            queryDatedWithinTimeRange(viewRange.start?.toJSON(), viewRange.end?.toJSON()),
            (res: any) => {
                const graphRes = buildGraph(res) as DatedObject[];
                addToCurrentEvents(
                    graphRes
                        .map(datedToBigCalendarEventsInRange(viewRange))
                        .flat()
                        .filter((x) => x),
                );
            },
            id,
            { metadataOnly: true },
        );

        return function cleanup() {
            tabContext.unsubscribe(id);
        };
    }, [viewRange]);

    const onRangeChange: (range: Date[] | { start: stringOrDate; end: stringOrDate }, view: View | undefined) => void =
        React.useCallback(
            async (range: any, view: any) => {
                // check if range has dates or strings
                setCurrentView(view);
                let startDate: Date;
                let endDate: Date;
                if (range.length && range[0] instanceof Date) {
                    startDate = (range as Date[])?.[0];
                    endDate = (range as Date[])?.[range.length - 1];
                } else if (isString(range.start)) {
                    startDate = new Date(range.start);
                    endDate = new Date(range.end);
                } else {
                    startDate = range.start as Date;
                    endDate = range.end as Date;
                }
                setViewRange({ start: startDate, end: endDate });
            },

            [],
        );

    return (
        localizer && (
            <BigCalendar
                localizer={localizer}
                events={currentEvents}
                startAccessor="start"
                endAccessor="end"
                step={15}
                timeslots={2}
                scrollToTime={new Date(1970, 1, 1, 7, 0, 0)}
                components={{ event: unigraphBigCalendarEventComponent }}
                eventPropGetter={(event: any, start: stringOrDate, end: stringOrDate, isSelected: boolean) => ({
                    style: { backgroundColor: '#fff', color: 'black', border: '1px', borderColor: 'black' },
                })}
                defaultView={currentView}
                onRangeChange={onRangeChange}
            />
        )
    );
}

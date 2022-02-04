import { Avatar, Typography } from '@material-ui/core';
import React from 'react';
import { buildGraph, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import Sugar from 'sugar';
import { unionBy, isString } from 'lodash/fp';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { AnyAaaaRecord } from 'dns';
import { Calendar as BigCalendar, DateLocalizer, momentLocalizer, stringOrDate, View } from 'react-big-calendar';
import moment from 'moment';
import {} from 'lodash';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { getDateAsUTC, TabContext } from '../../utils';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CurrentEvents } from './CurrentEvents';

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

    return (
        <div style={{ display: 'flex' }}>
            {inline ? [] : CalendarColor}

            <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {inline ? CalendarColor : []}
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
                    noDrag
                    noDrop
                    noContextMenu
                    inline
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
                                  inline
                                  style={{ verticalAlign: 'middle' }}
                              />
                          ))
                        : []}
                </div>
            </div>
        </div>
    );
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
    }  
        
        
        `;
};

const queryDatedWithinYear = (year: number, month: number) => {
    const start = new Date(year, month, 1).toJSON();
    const end = new Date(year + 1, month, 0).toJSON();
    return queryDatedWithinTimeRange(start, end);
};
const queryDatedWithinMonth = (year: number, month: number) => {
    const start = new Date(year, month, 1).toJSON();
    const end = new Date(year, month + 1, 0).toJSON();
    return queryDatedWithinTimeRange(start, end);
};
const queryDatedWithinWeek = (year: number, month: number, date: number) => {
    const start = new Date(year, month, date - 7).toJSON();
    const end = new Date(year, month, date + 7).toJSON();
    return queryDatedWithinTimeRange(start, end);
};

const datedToBigCalendarEvent = (datedObj: any): any => {
    const bigCalendarEventByType: any = {
        '$/schema/todo': (datedObjX: any) => {
            return {
                title: datedObjX.get('name').as('primitive'),
                start: new Date(datedObjX.get('time_frame/start/datetime').as('primitive')),
                end: new Date(datedObjX.get('time_frame/end/datetime').as('primitive')),
                allDay: true,
                unigraphObj: datedObjX,
            };
        },
        '$/schema/calendar_event': (datedObjX: any) => {
            return {
                title: datedObjX.get('name').as('primitive'),
                start: new Date(datedObjX.get('time_frame/start/datetime').as('primitive')),
                end: new Date(datedObjX.get('time_frame/end/datetime').as('primitive')),
                unigraphObj: datedObjX,
            };
        },
        '$/schema/journal': (datedObjX: any) => {
            return {
                title: datedObjX.get('note/text').as('primitive'),
                start: getDateAsUTC(datedObjX.get('date/datetime').as('primitive')),
                end: getDateAsUTC(datedObjX.get('date/datetime').as('primitive')),
                allDay: true,
                unigraphObj: datedObjX,
            };
        },
    };
    return bigCalendarEventByType[datedObj.getType()](datedObj);
};

const unigraphBigCalendarEventComponent = ({ event, ...props }: any) => {
    return <AutoDynamicView object={new UnigraphObject(event.unigraphObj)} inline callbacks={{ noDate: true }} />;
};

const getCurrentWeekStart = (today: Date) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
};
const getCurrentWeekEnd = (today: Date) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
};
export function Calendar() {
    const [currentEvents, setCurrentEvents] = React.useState<any>([]);
    const [localizer, _] = React.useState<DateLocalizer>(() => momentLocalizer(moment));
    const [currentView, setCurrentView] = React.useState<View | undefined>('week');
    const [viewRange, setViewRange] = React.useState<{ start: Date; end: Date }>({
        start: getCurrentWeekStart(new Date()),
        end: getCurrentWeekEnd(new Date()),
    });
    const tabContext = React.useContext(TabContext);
    const addToCurrentEvents = React.useCallback(
        (newEvents: any[]) => {
            setCurrentEvents(unionBy('unigraphObj.uid', newEvents, currentEvents));
        },

        [currentEvents],
    );

    React.useEffect(() => {
        const id = getRandomInt();
        tabContext.subscribeToQuery(
            queryDatedWithinTimeRange(viewRange.start?.toJSON(), viewRange.end?.toJSON()),
            (res: any) => {
                const graphRes = buildGraph(res);
                console.log('new calendar things', { res, graphRes, viewRange, currentEvents });
                addToCurrentEvents(graphRes.map(datedToBigCalendarEvent).filter((x) => x));
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

import { Avatar, Typography } from '@material-ui/core';
import React from 'react';
import { buildGraph, getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import Sugar from 'sugar';
import { fromPairs, flow, curry, mergeWith } from 'lodash/fp';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicObjectListView } from '../../components/ObjectView/DynamicObjectListView';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { TabContext } from '../../utils';

export function CalendarEvent({ data, callbacks }: any) {
    return (
        <div style={{ display: 'flex' }}>
            <div style={{ alignSelf: 'center', marginRight: '16px' }}>
                <Avatar
                    style={{
                        width: 16,
                        height: 16,
                        backgroundColor: data.get('calendar/color')?.as?.('primitive'),
                    }}
                >
                    {' '}
                </Avatar>
            </div>

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
                    noDrag
                    noDrop
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
    return `calendarObjs(func: uid(calendarUids)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @recurse(depth:8){ 
            uid
            <unigraph.id> 
            expand(_userpredicate_) 
        }
        var(func: eq(<unigraph.id>, "$/schema/time_point")) {
            <~type> {
                timepointUids as uid
            }
        }
        # get timepoint uids with datetime value var
        var(func: uid(timepointUids) )@cascade{
          uid
          _value {
            datetime @filter(le(<_value.%dt>, "${end}") AND ge(<_value.%dt>, "${start}")) {
              datetime_datetime as <_value.%dt>
            }
            _value_datetime:_value_datetime as min(val(datetime_datetime))
          }					
          
          timepoint_datetime:timepoint_datetime as min(val(_value_datetime))
          
        }
        
        # get sorted uids of dated objects connected to timepoints
        var(func: uid(timepointUids) ,orderasc:val(timepoint_datetime))@cascade{
          uid
          _value {
            datetime{	
              <_value.%dt>
            }
          }					
          
          <unigraph.origin>  {
              datedObjUids as uid
          } 
        }
          
          
        # get uids of dated objects that aren't timepoints or timeframes
        calendarUids as var(func: uid(datedObjUids)) @cascade{ 
          uid
          type @filter(NOT (eq(<unigraph.id>, "$/schema/time_point") OR eq(<unigraph.id>, "$/schema/time_frame") )) @cascade {
            <unigraph.id>
          }
          _value
        }  
        
        
        `;
};

const queryDatedWithinMonth = (year: number, month: number) => {
    const start = new Date(year, month, 1).toJSON();
    const end = new Date(year, month + 1, 0).toJSON();
    return queryDatedWithinTimeRange(start, end);
};

const groupByList = (getGroups: (x: any) => any, data: any[]) => {
    // items can appear in several groups
    return data.reduce((storage: any, item: any) => {
        const groups = getGroups(item);
        const groupItemPairs = groups.map((group: any) => [group, [item]]);
        const objectFromPairs = fromPairs(groupItemPairs);
        // console.log('groupByList', { groups, groupItemPairs, objectFromPairs, storage, item });
        // return { ...storage, ...objectFromPairs } );
        return mergeWith((x: any[], y: any[]) => (x ?? []).concat(y), objectFromPairs, storage);
    }, {});
};

const getDaysTimePointed = (datedObj: any) => {
    return [Sugar.Date.format(new Date(datedObj.get('date/datetime').as('primitive')), '{yyyy}-{MM}-{dd}')];
};

const roundToDate = (date: Date) => {
    return new Date(date).setHours(0, 0, 0, 1);
};
const getDaysBetween = (start: Date, end: Date): string[] => {
    const dates = [];
    const curr = start;
    while (roundToDate(curr) <= roundToDate(end)) {
        dates.push(Sugar.Date.format(curr, '{yyyy}-{MM}-{dd}'));
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
};
const getDaysTimeFramed = (datedObj: any) => {
    const start = new Date(datedObj.get('time_frame/start/datetime').as('primitive'));
    const end = new Date(datedObj.get('time_frame/end/datetime').as('primitive'));
    const days = getDaysBetween(start, end);
    return days;
};

const getDaysDated = (datedObj: any) => {
    // if object with time frame, get days within timeframe. if object with time point, get days with time point
    if (datedObj.get('time_frame')) {
        return getDaysTimeFramed(datedObj);
    }
    return getDaysTimePointed(datedObj);
};
const groupDatedByDay = curry(groupByList)(getDaysDated);

export function Calendar() {
    const [currentEvents, setCurrentEvents] = React.useState<any[]>([]);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const id = getRandomInt();
        const today = new Date();
        tabContext.subscribeToQuery(
            queryDatedWithinMonth(today.getFullYear(), today.getMonth()),
            (res: any) => {
                const graphRes = buildGraph(res);
                // setCurrentEvents(groupDatedByDay(graphRes));
                setCurrentEvents(graphRes);
            },
            id,
            { metadataOnly: true },
        );

        return function cleanup() {
            tabContext.unsubscribe(id);
        };
    }, []);

    return (
        <DynamicObjectListView
            groupBy="date"
            groupers={{
                date: groupDatedByDay,
            }}
            items={currentEvents}
            context={null}
            reverse
        />
    );
}

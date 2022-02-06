const { RRule, rrulestr } = require('rrule');
const { DateTime } = require('luxon');
const _ = require('lodash/fp');
const Sugar = require('sugar');

const inspect = _.curry((msg, x) => {
    console.log(msg, x);
    return x;
});

const rrulestrFixed = (rrule, options = {}) => {
    let timeStr = '';
    if (options.dtstart && !rrule.includes('DTSTART')) {
        timeStr = `DTSTART:${new Sugar.Date(options.dtstart).format('{yyyy}{MM}{dd}T{HH}{mm}{ss}Z').raw}\n`;
    }
    return rrulestr(timeStr + rrule, options);
};

// Full sync: fetch 50 events per page until exhausted all events
// If no sync token, perform full sync
const sync = async (calendar, unigraphCalendar, syncToken) => {
    let hasNext = true;
    let nextPageToken;
    let nextSyncToken;
    const items = [];
    let i = 0;
    while (hasNext) {
        i += 1;
        // eslint-disable-next-line no-await-in-loop
        const resp = await calendar.events.list({
            calendarId: unigraphCalendar._value.id['_value.%'],
            pageToken: nextPageToken,
            syncToken,
        });
        items.push(...resp.data.items);
        if (!resp.data.nextPageToken) {
            hasNext = false;
            if (resp.data.nextSyncToken) nextSyncToken = resp.data.nextSyncToken;
        } else nextPageToken = resp.data.nextPageToken;
    }
    // console.log('sync', { itemsLen: items.length, i });
    return { items, nextSyncToken };
};

const parseRecurrence = (start, end, rrule, timezone) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDateUTC = new Date(
        Date.UTC(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate(),
            startDate.getHours(),
            startDate.getMinutes(),
            startDate.getSeconds(),
        ),
    );
    const ruleOrSet = rrulestrFixed(rrule, { dtstart: startDateUTC });
    const diff = endDate.getTime() - startDate.getTime();
    const utcStarts = ruleOrSet.all().map((date) => {
        return {
            start: DateTime.fromJSDate(date).toUTC().setZone(timezone, { keepLocalTime: true }).toJSDate().toJSON(),
            end: DateTime.fromJSDate(date)
                .toUTC()
                .setZone(timezone, { keepLocalTime: true })
                .plus(diff)
                .toJSDate()
                .toJSON(),
        };
    });

    return utcStarts;
};

const queryFromEventId = (evid) => `(func: uid(evs)) @cascade {
  uid
  type {<unigraph.id>}
  _value {
      eventuid @filter(eq(<_value.%>, "${evid}")) {
        <_value.%>
      }
  }
}`;

const toEod = (date) => {
    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    return date;
};

const makeEventObj = (calUid, ev, recurrenceObj) => {
    return {
        name: {
            type: { 'unigraph.id': '$/schema/markdown' },
            _value: ev.summary,
        },
        calendar: { uid: calUid },
        about: {
            type: { 'unigraph.id': '$/schema/markdown' },
            _value: ev.description || '',
        },
        location: {
            type: { 'unigraph.id': '$/schema/markdown' },
            _value: ev.location || '',
        },
        time_frame: {
            start: {
                datetime: ev.start.dateTime || new Date(ev.start.date).toJSON(),
                all_day: ev.start.date ? true : undefined,
                timezone: ev.start.timeZone || 'local',
            },
            end: {
                datetime: ev.end.dateTime || new Date(ev.end.date).toJSON(),
                all_day: ev.end.date ? true : undefined,
                timezone: ev.end.timeZone || 'local',
            },
        },
        icaluid: ev.iCalUID,
        eventuid: ev.id,
        attendee: (ev.attendees || []).map((el) => ({
            person: `${el.displayName || el.email} <${el.email}>`,
            identifier: el.email,
        })),
        ...recurrenceObj,
    };
};

const makeRecurrenceQuery = (uid) =>
    `(func: uid(${uid})) { _value { recurrence_rules { uid } recurrence { uid <_value[> { uid } }} }`;
const deletePrevRecurrences = async (uids) => {
    // delete all previous recurrences
    const queries = uids.map(makeRecurrenceQuery);
    const prevFramesArray = (await unigraph.getQueries(queries)).map((res) => res?.[0]);
    prevFramesArray.forEach(async (prevFrames) => {
        if (
            prevFrames &&
            _.has(['_value', 'recurrence_rules', 'uid'], prevFrames) &&
            _.prop(['_value', 'recurrence', '_value['], prevFrames)
        ) {
            await unigraph.deleteObject(_.prop(['_value', 'recurrence_rules', 'uid'], prevFrames), true);
            await unigraph.deleteItemFromArray(
                prevFrames._value.recurrence.uid,
                prevFrames._value.recurrence['_value['].map(_.prop('uid')),
                prevFrames.uid ?? null,
                [],
            );
        }
    });
};

const makeRecurrenceObj = (ev) => {
    if (ev.recurrence) {
        const frames = parseRecurrence(
            ev.start.dateTime || new Date(ev.start.date).toJSON(),
            ev.end.dateTime || toEod(new Date(ev.end.date)).toJSON(),
            ev.recurrence.join('\n'),
            ev.start.timeZone,
        );
        return {
            recurrence_rules: ev.recurrence,
            recurrence: frames.map((el) => {
                return {
                    start: {
                        datetime: el.start,
                        timezone: ev.start.timeZone,
                    },
                    end: {
                        datetime: el.end,
                        timezone: ev.start.timeZone,
                    },
                };
            }),
        };
    }
    return {};
};

// make one event per recurrence
const expandRecurrences = (evObj) => {
    const recurrenceLen = evObj.recurrence?.length;
    if (recurrenceLen > 0) {
        // console.log('0 expandingRecurrences', { evObj, recurrence: evObj.recurrence[0] });
        const events = evObj.recurrence.map((recurrence, i) => {
            return {
                ...evObj,
                time_frame: {
                    start: {
                        datetime: recurrence.start.datetime,
                        all_day: evObj.time_frame.start.all_day,
                        timezone: recurrence.start.timezone,
                    },
                    end: {
                        datetime: recurrence.end.datetime,
                        all_day: evObj.time_frame.end.all_day,
                        timezone: recurrence.end.timezone,
                    },
                },
                eventuid: `${evObj.eventuid}_${i}`,
                recurrence: undefined,
            };
        });
        return events;
    }
    return [evObj];
};

const makeRecurrentEventObj = _.curry((calUid, ev) => {
    const recurrenceObj = makeRecurrenceObj(ev);
    return makeEventObj(calUid, ev, recurrenceObj);
});

const syncGoogleCalendarSpecific = async () => {
    const calendarUid = context?.params?.uid;
    const { calendar } = context;
    const unigraphCalendar = await unigraph.getObject(calendarUid);
    // console.log('syncGoogleCalendarSpecific', { calendarUid, calendar, unigraphCalendar });
    const syncToken = unigraphCalendar._value?.sync_token?.['_value.%'] || undefined;
    // Uncomment to debug:
    // const syncToken = undefined;
    const { items, nextSyncToken } = await sync(calendar, unigraphCalendar, syncToken);

    // DEBUG: delete all events
    // items.filter(_.propEq('status', 'cancelled')).map(_.prop('id')).map(queryFromEventId)

    // find cancelled events
    const cancelledEventQueries = items.filter(_.propEq('status', 'cancelled')).map(_.prop('id')).map(queryFromEventId);
    const cancelledEventObjs = await unigraph.getQueries(
        cancelledEventQueries,
        undefined,
        undefined,
        `var(func: eq(<unigraph.id>, "$/schema/calendar_event")) {
        <~type> { evs as uid }
        }`,
    );
    // SIDE-EFFECT: Delete cancelled events existing in the unigraph db
    cancelledEventObjs
        .map(_.prop(['0', 'uid']))
        .filter(_.negate(_.isNil))
        .forEach(unigraph.deleteObject);

    // TODO (by Sophia): process these single instances as well (that is, when ev.recurringEventId exists)
    const confirmedEventsNonRecurring = items
        .filter(_.propEq('status', 'confirmed'))
        .filter((ev) => !ev.recurringEventId);

    // console.log('confirmedEventsNonRecurring', {
    //     confirmedEventsNonRecurringLen: confirmedEventsNonRecurring.length,
    // });

    const queriesForEventsWithRecurrence = confirmedEventsNonRecurring
        .filter(_.has('recurrence'))
        .map(_.prop('id'))
        .map(queryFromEventId);

    const objsWithRecurrence = await unigraph
        .getQueries(
            queriesForEventsWithRecurrence,
            undefined,
            undefined,
            `var(func: eq(<unigraph.id>, "$/schema/calendar_event")) {
                <~type> { evs as uid }
        }`,
        )
        .then((res) => res.map(_.prop(['0', 'uid'])).filter((x) => x));
    // console.log('objsWithRecurrence', { objsWithRecurrenceLen: objsWithRecurrence.length });

    const toAdd = confirmedEventsNonRecurring.filter((x) => x).map(makeRecurrentEventObj(calendarUid));
    // .map(expandRecurrences)
    // .flat();
    // console.log('toAdd', { toAddLen: toAdd.length });

    // SIDE-EFFECT: delete previous recurrences
    deletePrevRecurrences(objsWithRecurrence);
    if (toAdd.length > 0) {
        await unigraph.addObject(toAdd, '$/schema/calendar_event');
    }
    if (syncToken !== nextSyncToken) {
        await unigraph.updateObject(calendarUid, {
            sync_token: nextSyncToken,
        });
    }
};
await syncGoogleCalendarSpecific();

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
const sync = async (calendar, cal, syncToken) => {
    let hasNext = true;
    let nextPageToken;
    let nextSyncToken;
    const items = [];
    let i = 0;
    while (hasNext) {
        i += 1;
        // eslint-disable-next-line no-await-in-loop
        const resp = await calendar.events.list({
            calendarId: cal._value.id['_value.%'],
            pageToken: nextPageToken,
            syncToken,
        });
        items.push(...resp.data.items);
        if (!resp.data.nextPageToken) {
            hasNext = false;
            if (resp.data.nextSyncToken) nextSyncToken = resp.data.nextSyncToken;
        } else nextPageToken = resp.data.nextPageToken;
    }
    return { items: items.slice(items.length - 101), nextSyncToken };
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

const makeRecurrentEventObj = (calUid, ev) => {
    const recurrenceObj = makeRecurrenceObj(ev);
    return makeEventObj(calUid, ev, recurrenceObj);
};

const syncGoogleCalendarSpecific = async () => {
    const calUid = context?.params?.uid;
    const { calendar } = context;
    const cal = await unigraph.getObject(calUid);
    const syncToken = cal._value?.sync_token?.['_value.%'] || undefined;
    const { items, nextSyncToken } = await syncDebug(calendar, cal, syncToken);
    const itemSlice = items;
    console.log(itemSlice);

    // find cancelled events
    // TODO: not just, 20, the whole thing
    const cancelledEventQueries = itemSlice
        .filter(_.propEq('status', 'cancelled'))
        .map(_.prop('id'))
        .map(queryFromEventId);
    const cancelledEventObjs = await unigraph.getQueries(
        cancelledEventQueries,
        undefined,
        undefined,
        `var(func: eq(<unigraph.id>, "$/schema/calendar_event")) {
  <~type> { evs as uid }
}`,
    );
    // Delete cancelled events existing in the unigraph db
    const cancelledEventUids = cancelledEventObjs.map(_.prop(['0', 'uid'])).filter(_.negate(_.isNil));
    cancelledEventUids.forEach(unigraph.deleteObject);
    // TODO: process these single instances as well (when ev.recurringEventId exists)
    const confirmedEventsNonRecurring = itemSlice
        .filter(_.propEq('status', 'confirmed'))
        .filter((ev) => !ev.recurringEventId);

    const eventsWithRecurrenceQueries = confirmedEventsNonRecurring
        .filter(_.prop('recurrence'))
        .map(_.prop('id'))
        .map(queryFromEventId);

    const objsWithRecurrenceResults = await unigraph.getQueries(
        eventsWithRecurrenceQueries,
        undefined,
        undefined,
        `var(func: eq(<unigraph.id>, "$/schema/calendar_event")) {
  <~type> { evs as uid }
}`,
    );
    // delete previous recurrences
    const objsWithRecurrence = objsWithRecurrenceResults.map(_.prop(['0', 'uid'])).filter(_.negate(_.isNil));
    deletePrevRecurrences(objsWithRecurrence);
    const toAdd = confirmedEventsNonRecurring.filter(_.negate(_.isNil)).map(_.curry(makeRecurrentEventObj)(calUid));

    if (toAdd.length > 0) {
        await unigraph.addObject(toAdd, '$/schema/calendar_event');
    }
    if (syncToken !== nextSyncToken) {
        await unigraph.updateObject(calUid, {
            sync_token: nextSyncToken,
        });
    }
};
await syncGoogleCalendarSpecific();

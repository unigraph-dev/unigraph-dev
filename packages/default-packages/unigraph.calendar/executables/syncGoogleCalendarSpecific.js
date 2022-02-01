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
    items.slice(items.length);
    return { items, nextSyncToken };
};

const syncDebug = async (calendar, cal, syncToken) => {
    const sophiaData = [
        {
            kind: 'calendar#event',
            etag: '"3286778532596000"',
            id: 'jd36r6r1ume9t4tj7ok023a7lr_R20210416T160000',
            status: 'confirmed',
            htmlLink:
                'https://www.google.com/calendar/event?eid=amQzNnI2cjF1bWU5dDR0ajdvazAyM2E3bHJfMjAyMTA0MTZUMTYwMDAwWiBsaXNhLmlyby51bW9udHJlYWwuY2Ffc3ZhZTUyczBxbzVwYm8wNTRjZmoyZjU1dWNAZw',
            created: '2020-04-01T22:46:27.000Z',
            updated: '2022-01-28T17:01:06.298Z',
            summary: 'Research Roundtable - GatherTown!',
            description:
                'Welcome anyone doing anything that can plausibly be described as research!\n\nThis is an informal reading group aimed at capturing the vibe of conversations that happen in the kitchen after tea talks. Feel free to talk about the tea talk or any other research topics, especially answering the question "what are you working on lately?" or "what are you interested in lately?", or just come to listen/chat with others. There\'s no obligation to talk about yourself or even talk at all if you don\'t want to :).\n\nhttps://gather.town/app/C8M1ZrCKDHFDsBWT/Mila%20Open%20Gather\n\nPlease join #research-roundtable  for more information, or to continue informal research conversations on slack.',
            location: 'https://gather.town/app/C8M1ZrCKDHFDsBWT/Mila%20Open%20Gather',
            creator: {
                email: 'tegan.maharaj@mila.quebec',
            },
            organizer: {
                email: 'lisa.iro.umontreal.ca_svae52s0qo5pbo054cfj2f55uc@group.calendar.google.com',
                displayName: 'MILA Public',
                self: true,
            },
            start: {
                dateTime: '2021-04-16T12:00:00-04:00',
                timeZone: 'America/Toronto',
            },
            end: {
                dateTime: '2021-04-16T13:00:00-04:00',
                timeZone: 'America/Toronto',
            },
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=FR'],
            iCalUID: 'jd36r6r1ume9t4tj7ok023a7lr_R20210416T160000@google.com',
            sequence: 3,
            reminders: {
                useDefault: true,
            },
            eventType: 'default',
        },
        {
            kind: 'calendar#event',
            etag: '"3286799582070000"',
            id: 'v901e332udhjdla4ctjssvks4o_20220121T200000Z',
            status: 'confirmed',
            htmlLink:
                'https://www.google.com/calendar/event?eid=djkwMWUzMzJ1ZGhqZGxhNGN0anNzdmtzNG9fMjAyMjAxMjFUMjAwMDAwWiBsaXNhLmlyby51bW9udHJlYWwuY2Ffc3ZhZTUyczBxbzVwYm8wNTRjZmoyZjU1dWNAZw',
            created: '2021-02-04T13:45:54.000Z',
            updated: '2022-01-28T19:56:31.035Z',
            summary: 'Neural-AI Welcome event Winter 2022',
            description:
                '<h1>Tentative Schedule&nbsp;</h1><br><table><colgroup><col><col></colgroup><tbody><tr><td><br>Time</td><td><br>Event:</td></tr><tr><td><br>3.05pm to 3.10pm</td><td><br>Opening Remarks</td></tr><tr><td><br>3.10pm to 3.20pm</td><td><br>Blake Richards</td></tr><tr><td><br>3.20pm to 3.30pm</td><td><br>Doina Precup</td></tr><tr><td><br>3.30pm to 3.35pm&nbsp;</td><td><br>QnA for Blake Richards &amp; Doina Precup</td></tr><tr><td><br>3.35pm to 3.45pm</td><td><br>Guillaume Lajoie</td></tr><tr><td><br>3.45pm to 3.55pm</td><td><br>Karim Jerbi</td></tr><tr><td><br>3.55pm to 4.00pm</td><td><br>QnA for Guillaume Lajoie &amp; Karim Jerbi&nbsp;</td></tr><tr><td><br>4.00pm to 4.10pm</td><td><br>Eilif Muller</td></tr><tr><td><br>4.10pm to 4.20pm</td><td><br>Irina Rish</td></tr><tr><td><br>4.20pm to 4.25pm</td><td><br>QnA for Eilif Muller &amp; Irina Rish</td></tr><tr><td><br>4.25 pm to 4.35pm</td><td><br>Guillaume Dumas</td></tr><tr><td><br>4.35pm to 4.45pm</td><td><br>Pouya Bashivan</td></tr><tr><td><br>4.45pm to 4.50pm</td><td><br>QnA for Guillaume Dumas &amp; Pouya Bashivan&nbsp;</td></tr><tr><td><br>4.50pm to 4.55pm</td><td><br>Closing remarks</td></tr></tbody></table>',
            location: 'https://mcgill.zoom.us/j/86180886114?pwd=MVZNc0huR2Z5OFNEM085M2gyMzVDUT09',
            creator: {
                email: 'puelmatm@mila.quebec',
            },
            organizer: {
                email: 'lisa.iro.umontreal.ca_svae52s0qo5pbo054cfj2f55uc@group.calendar.google.com',
                displayName: 'MILA Public',
                self: true,
            },
            start: {
                dateTime: '2022-01-21T15:00:00-05:00',
                timeZone: 'America/New_York',
            },
            end: {
                dateTime: '2022-01-21T17:00:00-05:00',
                timeZone: 'America/New_York',
            },
            recurringEventId: 'v901e332udhjdla4ctjssvks4o_R20211001T190000',
            originalStartTime: {
                dateTime: '2022-01-21T15:00:00-05:00',
                timeZone: 'America/New_York',
            },
            iCalUID: 'v901e332udhjdla4ctjssvks4o_R20211001T190000@google.com',
            sequence: 1,
            attendees: [
                {
                    email: 'samieima@mila.quebec',
                    responseStatus: 'accepted',
                },
                {
                    email: 'puelmatm@mila.quebec',
                    responseStatus: 'needsAction',
                },
                {
                    email: 'max.puelmatouzel@gmail.com',
                    responseStatus: 'needsAction',
                },
                {
                    email: 'eilif.muller@umontreal.ca',
                    responseStatus: 'needsAction',
                },
                {
                    email: 'pouya.bashivan@mcgill.ca',
                    responseStatus: 'needsAction',
                },
                {
                    email: 'guillaume.lajoie@mila.quebec',
                    responseStatus: 'accepted',
                },
                {
                    email: 'dprecup@cs.mcgill.ca',
                    responseStatus: 'accepted',
                },
                {
                    email: 'irina.rish@mila.quebec',
                    responseStatus: 'needsAction',
                },
                {
                    email: 'blake.richards@mila.quebec',
                    responseStatus: 'accepted',
                },
                {
                    email: 'guillaume.dumas@ppsp.team',
                    responseStatus: 'accepted',
                },
                {
                    email: 'yoshua.bengio@mila.quebec',
                    responseStatus: 'tentative',
                },
                {
                    email: 'chuaraym@mila.quebec',
                    responseStatus: 'accepted',
                },
                {
                    email: 'irina.rish@gmail.com',
                    responseStatus: 'accepted',
                },
            ],
            guestsCanModify: true,
            reminders: {
                useDefault: true,
            },
            eventType: 'default',
        },
        {
            kind: 'calendar#event',
            etag: '"3286800433042000"',
            id: 'v901e332udhjdla4ctjssvks4o_20211008T190000Z',
            status: 'cancelled',
            recurringEventId: 'v901e332udhjdla4ctjssvks4o_R20211001T190000',
            originalStartTime: {
                dateTime: '2021-10-08T15:00:00-04:00',
                timeZone: 'America/Toronto',
            },
        },
        {
            kind: 'calendar#event',
            etag: '"3286800433042000"',
            id: 'v901e332udhjdla4ctjssvks4o_R20211001T190000',
            status: 'confirmed',
            htmlLink:
                'https://www.google.com/calendar/event?eid=djkwMWUzMzJ1ZGhqZGxhNGN0anNzdmtzNG9fMjAyMTEwMDFUMTkwMDAwWiBsaXNhLmlyby51bW9udHJlYWwuY2Ffc3ZhZTUyczBxbzVwYm8wNTRjZmoyZjU1dWNAZw',
            created: '2021-02-04T13:45:54.000Z',
            updated: '2022-01-28T20:03:36.521Z',
            summary: 'Neural-AI RG',
            creator: {
                email: 'puelmatm@mila.quebec',
            },
            organizer: {
                email: 'lisa.iro.umontreal.ca_svae52s0qo5pbo054cfj2f55uc@group.calendar.google.com',
                displayName: 'MILA Public',
                self: true,
            },
            start: {
                dateTime: '2021-10-01T15:00:00-04:00',
                timeZone: 'America/Toronto',
            },
            end: {
                dateTime: '2021-10-01T16:00:00-04:00',
                timeZone: 'America/Toronto',
            },
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=FR'],
            iCalUID: 'v901e332udhjdla4ctjssvks4o_R20211001T190000@google.com',
            sequence: 1,
            attendees: [
                {
                    email: 'samieima@mila.quebec',
                    responseStatus: 'needsAction',
                },
                {
                    email: 'puelmatm@mila.quebec',
                    responseStatus: 'needsAction',
                },
                {
                    email: 'max.puelmatouzel@gmail.com',
                    responseStatus: 'needsAction',
                },
            ],
            guestsCanModify: true,
            reminders: {
                useDefault: true,
            },
            eventType: 'default',
        },
        {
            kind: 'calendar#event',
            etag: '"3286800434506000"',
            id: '4bfkvue0v9e3m1qguk8t76gu68',
            status: 'confirmed',
            htmlLink:
                'https://www.google.com/calendar/event?eid=NGJma3Z1ZTB2OWUzbTFxZ3VrOHQ3Nmd1NjggbGlzYS5pcm8udW1vbnRyZWFsLmNhX3N2YWU1MnMwcW81cGJvMDU0Y2ZqMmY1NXVjQGc',
            created: '2022-01-26T18:33:03.000Z',
            updated: '2022-01-28T20:03:37.253Z',
            summary: 'Share Time - Early Do’s and Don’t: Lessons From Young Entrepreneurs',
            description:
                '<ul><li><b>What is a&nbsp;<i>Share Time</i>?</b>&nbsp;It is a new offer of monthly one-hour talks about entrepreneurship for the Mila community - time to ask your&nbsp;<i>actually-not-stupid</i>&nbsp;questions, meet like-minded (future) entrepreneurs, and learn&nbsp;from&nbsp;great&nbsp;startup&nbsp;co-<wbr>founders. It is open to everyone, join us!</li><li><b>Click on this link to register</b>&nbsp;<b>and join their conversation</b>:&nbsp;<a href="https://us06web.zoom.us/meeting/register/tZAsc-qupjMtGdIFP11VfCAxF4kI30gKTqN6" id="ow832" __is_owner="true">https://us06web.<wbr>zoom.us/meeting/register/<wbr>tZAsc-<wbr>qupjMtGdIFP11VfCAxF4kI30gKTqN6</a><br></li></ul>',
            creator: {
                email: 'karl.goedike@mila.quebec',
            },
            organizer: {
                email: 'lisa.iro.umontreal.ca_svae52s0qo5pbo054cfj2f55uc@group.calendar.google.com',
                displayName: 'MILA Public',
                self: true,
            },
            start: {
                dateTime: '2022-01-28T15:00:00-05:00',
                timeZone: 'America/New_York',
            },
            end: {
                dateTime: '2022-01-28T16:00:00-05:00',
                timeZone: 'America/New_York',
            },
            iCalUID: '4bfkvue0v9e3m1qguk8t76gu68@google.com',
            sequence: 0,
            reminders: {
                useDefault: true,
            },
            eventType: 'default',
        },
    ];
    return { items: sophiaData, nextSyncToken: syncToken };
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
}

var(func: eq(<unigraph.id>, "$/schema/calendar_event")) {
  <~type> { evs as uid }
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

    // find cancelled events
    // TODO: not just, 20, the whole thing
    const cancelledEventQueries = itemSlice
        .filter(_.propEq('status', 'cancelled'))
        .map(_.prop('id'))
        .map(queryFromEventId);
    const cancelledEventObjs = await unigraph.getQueries(cancelledEventQueries);
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

    const objsWithRecurrenceResults = await unigraph.getQueries(eventsWithRecurrenceQueries);
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

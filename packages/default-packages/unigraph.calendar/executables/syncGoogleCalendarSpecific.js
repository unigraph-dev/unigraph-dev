const calUid = context.params.uid;
const calendar = context.calendar;
const cal = await unigraph.getObject(calUid);

const { RRule} = require('rrule');
const { DateTime } = require("luxon");

// Full sync: fetch 50 events per page until exhausted all events
// If no sync token, perform full sync

const sync = async (syncToken) => {
    let hasNext = true;
    let nextPageToken = undefined;
    let nextSyncToken = undefined;
    const items = [];
    while (hasNext) {
        const resp = await calendar.events.list({
            calendarId: cal['_value']['id']['_value.%'],
            pageToken: nextPageToken,
            syncToken,
        });
        items.push(...resp.data.items);
        if (!resp.data.nextPageToken) {
            hasNext = false;
            if (resp.data.nextSyncToken) nextSyncToken = resp.data.nextSyncToken;
        } else nextPageToken = resp.data.nextPageToken;
    }
    return {items, nextSyncToken};
}
syncToken = cal['_value']?.['sync_token']?.['_value.%'] || undefined;
const {items, nextSyncToken} = await sync(syncToken);
//console.log(items[items.length-1])

const parseRecurrence = (start, end, rrule, timezone) => {
  const startDate = new Date(start), endDate = new Date(end);
  const options = RRule.parseString(rrule);
  options.dtstart = new Date(Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    startDate.getHours(),
    startDate.getMinutes(),
    startDate.getSeconds()
  ))
  var rule = new RRule(options);
  const diff = endDate.getTime() - startDate.getTime();
  const utcStarts = rule.all().map(date => {
    return {
      start: DateTime.fromJSDate(date)
        .toUTC()
        .setZone(timezone, { keepLocalTime: true })
        .toJSDate().toJSON(),
      end: DateTime.fromJSDate(date)
        .toUTC()
        .setZone(timezone, { keepLocalTime: true })
        .plus(diff)
        .toJSDate().toJSON(),
    }
  })
  
  return utcStarts;
}

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
}`

const toEod = (date) => {
  date.setHours(23);
  date.setMinutes(59);
  date.setSeconds(59);
  return date;
}

// Process the changes, looping through all the events one by one
//if (cal['_value'].id?.['_value.%'] !== "c_5le2cv45o72utfkh4bcntpj2f4@group.calendar.google.com") return;

for (let i=0; i<items.length; ++i) {
  const ev = items[i];
  if (ev.status === "cancelled") {
    const uid = (await unigraph.getQueries([queryFromEventId(ev.id)]))?.[0]?.[0]?.uid;
    if (uid) await unigraph.deleteObject(uid);
  } else if (ev.status === "confirmed") {
    if (ev.recurringEventId) continue; // TODO: process these single instances as well
    else {
      let recurrenceObj = {};
      if (ev.recurrence) {
        const frames = parseRecurrence(ev.start.dateTime || (new Date(ev.start.date)).toJSON(), ev.end.dateTime || toEod(new Date(ev.end.date)).toJSON(), ev.recurrence[0], ev.start.timeZone);
        const uid = (await unigraph.getQueries([queryFromEventId(ev.id)]))?.[0]?.[0]?.uid;
        if (uid) {
          // delete all previous recurrences
          const prevFrames = (await unigraph.getQueries([`(func: uid(${uid})) { _value { recurrence_rules { uid } recurrence { uid <_value[> { uid } }} }`]))?.[0]?.[0];
          if (prevFrames && prevFrames._value.recurrence_rules?.uid && prevFrames._value.recurrence?.['_value[']) {
            await unigraph.deleteObject(prevFrames._value.recurrence_rules.uid, true);
            await unigraph.deleteItemFromArray(prevFrames._value.recurrence.uid, prevFrames._value.recurrence['_value['].map(el => el.uid), uid, []);
          }
        }
        recurrenceObj = {
          recurrence_rules: ev.recurrence,
          recurrence: frames.map(el => {
            return {
              start: {
                datetime: el.start,
                timezone: ev.start.timeZone
              },
              end: {
                datetime: el.end,
                timezone: ev.start.timeZone
              }
            }
          })
        }
      }
      const evObj = {
        name: {
          type: {"unigraph.id": "$/schema/markdown"},
          _value: ev.summary
        },
        calendar: { uid: calUid },
        about: {
          type: {"unigraph.id": "$/schema/markdown"},
          _value: ev.description || ""
        },
        location: {
          type: {"unigraph.id": "$/schema/markdown"},
          _value: ev.location || ""
        },
        time_frame: {
          start: {
            datetime: ev.start.dateTime || (new Date(ev.start.date)).toJSON(),
            timezone: ev.start.timeZone || "local"
          },
          end: {
            datetime: ev.end.dateTime || toEod(new Date(ev.end.date)).toJSON(),
            timezone: ev.end.timeZone || "local"
          }
        },
        icaluid: ev.iCalUID,
        eventuid: ev.id,
        ...recurrenceObj
      }
      await unigraph.addObject(evObj, "$/schema/calendar_event")
    }
  }
}


await unigraph.updateObject(calUid, {
  sync_token: nextSyncToken
});
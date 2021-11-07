const calUid = context.params.uid;
const calendar = context.calendar;
const cal = await unigraph.getObject(calUid);
console.log(cal.uid, calUid)

const { RRule, RRuleSet, rrulestr } = require('rrule');
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
syncToken = cal['_value']['sync_token']['_value.%'] || undefined;
console.log(syncToken)
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
        const frames = parseRecurrence(ev.start.dateTime || (new Date(ev.start.date)).toJSON(), ev.end.dateTime || toEod(new Date(ev.end.date)).toJSON(), ev.recurrence[0], ev.start.timeZone)
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
      if (ev.recurrence) console.log(JSON.stringify(evObj));
      await unigraph.addObject(evObj, "$/schema/calendar_event")
    }
  }
}


await unigraph.updateObject(calUid, {
  sync_token: nextSyncToken
});


/* 
cal = {
  uid: '0x5f29c',
  type: {                                                                                                                                                                                                                                                       @typescript-eslint/
    uid: '0x5eb04',
    'unigraph.id': '$/schema/calendar',                                                                                                                                                                                                  for decorative images  jsx-a11y/alt-text 
    '_value[': [ [Object] ],
    'dgraph.type': [ 'Type' ]
  },
  _timestamp: {
    uid: '0x68c98',
    _updatedAt: '2021-11-02T17:50:25.107Z',
    _createdAt: '2021-11-02T17:50:25.107Z'
  },
  'dgraph.type': [ 'Entity' ],                                                                                                                                                                                                          r remove the dependency array  react-hooks/
  _value: {
    uid: '0x5f29f',
    color: { uid: '0x5f294', _value: [Object] },
    sync_token: { uid: '0x5f2a5', '_value.%': '' },                                                                                                                                                                                     he dependency array  react-hooks/exhaustive
    name: { uid: '0x5f29d', _value: [Object] },
    foreground_color: { uid: '0x5f29e', _value: [Object] },
    id: {
      uid: '0x5f2a2',
      '_value.%': 'c_ikhq6vf0eudsd28eoo1jan3f54@group.calendar.google.com'
    }
  }
}
*/

/*                             
{
    "kind": "calendar#event",
    "etag": "\"3263996528980000\"",
    "id": "_6h034d1mcgq3ap1k5koj6cb45kq68cj65lgj4cj25ksj8phoc4o66dj66dh36",                                                                                                                                e depe
    "status": "confirmed",
    "htmlLink": "https://www.google.com/calendar/event?eid=XzZoMDM0ZDFtY2dxM2FwMWs1a29qNmNiNDVrcTY4Y2o2NWxnajRjajI1a3NqOHBob2M0bzY2ZGo2NmRoMzZfMjAyMTA5MDFUMTQwNTAwWiBjX2lraHE2dmYwZXVkc2QyOGVvbzFqYW4zZjU0QGc",
    "created": "2021-09-17T14:27:11.000Z",                                                                                                                                                                 cy arr
    "updated": "2021-09-18T20:51:04.490Z",
    "summary": "MATH466-001 LEC (BURN 1B23)",
    "description": "Honours Complex Analysis.\nLecture in Burnside Hall 1B23\nhttp://maps.mcgill.ca/?campus=DWT&txt=EN&id=Burnside",                                                                      
    "location": "Burnside Hall 805 rue Sherbrooke ouest",
    "creator": {
        "email": "i@sophiaxu.me"
    },
    "organizer": {
        "email": "c_ikhq6vf0eudsd28eoo1jan3f54@group.calendar.google.com",
        "displayName": "McGill",                                                                                                                                                                           Nov-21
        "self": true
    },
    "start": {
        "dateTime": "2021-09-01T10:05:00-04:00",
        "timeZone": "America/Toronto"
    },
    "end": {
        "dateTime": "2021-09-01T11:25:00-04:00",
        "timeZone": "America/Toronto"
    },
    "recurrence": [
        "RRULE:FREQ=WEEKLY;UNTIL=20211206T000000Z;INTERVAL=1;BYDAY=MO,WE"
    ],
    "transparency": "transparent",
    "visibility": "public",
    "iCalUID": "4@246d45d4-131d-4d2f-a22b-94f8a0c6f3b3",
    "sequence": 0,
    "reminders": {
        "useDefault": true
    },
    "eventType": "default"
}

  {                                                                                                                                                                                                                                     
    kind: 'calendar#event',                                                                                                                                                                                                             
    etag: '"3271829237206000"',                                                                                                                                                                                                         
    id: '46qdd4ugoi8f9rp6juu3nij0sl',                                                                                                                                                                                                   
    status: 'confirmed',                                                                                                                                                                                                                
    htmlLink: 'https://www.google.com/calendar/event?eid=NDZxZGQ0dWdvaThmOXJwNmp1dTNuaWowc2xfMjAyMTA5MjRUMTgzMDAwWiBpQHNvcGhpYXh1Lm1l',                                                                                                 
    created: '2021-09-23T21:06:24.000Z',                                                                                                                                                                                                
    updated: '2021-11-03T04:43:38.603Z',                                                                                                                                                                                                
    summary: 'EA McGill Meeting',                                                                                                                                                                                                       
    location: 'Redpath Museum, 859 Rue Sherbrooke O, Montréal, QC H3A 0C4, Canada',                                                                                                                                                     
    creator: { email: 'i@sophiaxu.me', self: true },                                                                                                                                                                                    
    organizer: { email: 'i@sophiaxu.me', self: true },                                                                                                                                                                                  
    start: {                                                                                                                                                                                                                            
      dateTime: '2021-09-24T14:30:00-04:00',                                                                                                                                                                                            
      timeZone: 'America/Toronto'                                                                                                                                                                                                       
    },                                                                                                                                                                                                                                  
    end: {                                                                                                                                                                                                                              
      dateTime: '2021-09-24T15:15:00-04:00',                                                                                                                                                                                            
      timeZone: 'America/Toronto'                                                                                                                                                                                                       
    },                                                                                                                                                                                                                                  
    recurrence: [ 'RRULE:FREQ=WEEKLY;WKST=SU;UNTIL=20211105T035959Z;BYDAY=FR' ],                                                                                                                                                        
    iCalUID: '46qdd4ugoi8f9rp6juu3nij0sl@google.com',                                                                                                                                                                                   
    sequence: 1,                                                                                                                                                                                                                        
    reminders: { useDefault: true },                                                                                                                                                                                                    
    eventType: 'default'                                                                                                                                                                                                                
  },  
  {
    kind: 'calendar#event',
    etag: '"3271829237206000"',
    id: '46qdd4ugoi8f9rp6juu3nij0sl_20211029T183000Z',
    status: 'confirmed',
    htmlLink: 'https://www.google.com/calendar/event?eid=NDZxZGQ0dWdvaThmOXJwNmp1dTNuaWowc2xfMjAyMTEwMjlUMTgzMDAwWiBpQHNvcGhpYXh1Lm1l',
    created: '2021-09-23T21:06:24.000Z',
    updated: '2021-11-03T04:43:38.603Z',
    summary: 'EA McGill Meeting',
    description: 'jkknknk',
    location: 'Redpath Museum, 859 Rue Sherbrooke O, Montréal, QC H3A 0C4, Canada',
    creator: { email: 'i@sophiaxu.me', self: true },
    organizer: { email: 'i@sophiaxu.me', self: true },
    start: {
      dateTime: '2021-10-29T18:00:00-04:00',
      timeZone: 'America/Toronto'
    },
    end: {
      dateTime: '2021-10-29T18:45:00-04:00',
      timeZone: 'America/Toronto'
    },
    recurringEventId: '46qdd4ugoi8f9rp6juu3nij0sl',
    originalStartTime: {
      dateTime: '2021-10-29T14:30:00-04:00',
      timeZone: 'America/Toronto'
    },
    iCalUID: '46qdd4ugoi8f9rp6juu3nij0sl@google.com',
    sequence: 3,
    reminders: { useDefault: true },
    eventType: 'default'
  },
  {
    kind: 'calendar#event',
    etag: '"3271829237206000"',
    id: '6onmbkid3ekm9hal9b5s7l78cv',
    status: 'confirmed',
    htmlLink: 'https://www.google.com/calendar/event?eid=Nm9ubWJraWQzZWttOWhhbDliNXM3bDc4Y3ZfMjAyMTExMDVUMjIwMDAwWiBpQHNvcGhpYXh1Lm1l',
    created: '2021-09-23T21:06:24.000Z',
    updated: '2021-11-03T04:43:38.603Z',
    summary: 'EA McGill Meeting',
    location: 'Redpath Museum, 859 Rue Sherbrooke O, Montréal, QC H3A 0C4, Canada',
    creator: { email: 'i@sophiaxu.me', self: true },
    organizer: { email: 'i@sophiaxu.me', self: true },
    start: {
      dateTime: '2021-11-05T18:00:00-04:00',
      timeZone: 'America/Toronto'
    },
    end: {
      dateTime: '2021-11-05T18:45:00-04:00',
      timeZone: 'America/Toronto'
    },
    recurrence: [ 'RRULE:FREQ=WEEKLY;WKST=SU;UNTIL=20211225T045959Z;BYDAY=FR' ],
    iCalUID: '6onmbkid3ekm9hal9b5s7l78cv@google.com',
    sequence: 2,
    reminders: { useDefault: true },
    eventType: 'default'
  }
*/
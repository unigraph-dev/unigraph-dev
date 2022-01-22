/**
 * Gets all upcoming events (objects) with a time_frame annotation.
 *
 * @param {boolean} current whether to get only the current events (start < now < end)
 * @param {string | number} start the start date or time. Defaults to current time if not specified.
 * @param {number} days How many days to look ahead (only matters if current is not true, default to 7 = next week)
 * @param {boolean} getFrames whether to pair the events with their corresponding timeframes.
 */
let { current, days, start, getFrames, getAll, greaterThanNow, allEnd } = context.params;
if (!days) days = 7;

const getSod = (date) => {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.toJSON();
};

const getEod = (date) => {
    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    date.setMilliseconds(999);
    return date.toJSON();
};

start = start ? new Date(start) : new Date();
const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * days);

return `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @recurse {
    uid
    <unigraph.id>
    expand(_userpredicate_)
}
frames as var(func: uid(partf)) @cascade {
    _value {
        start {
            _value {
                _value {
                    datetime @filter(le(<_value.%dt>, "${current ? start.toJSON() : getEod(end)}") ${
    greaterThanNow ? `AND ge(<_value.%dt>, "${new Date().toJSON()}")` : ''
}) {
                        <_value.%dt>
                    }
                }
            }
        }
        ${
            allEnd
                ? ''
                : `end {
            _value {
                _value {
                    datetime @filter(ge(<_value.%dt>, "${current ? start.toJSON() : getSod(start)}")) {
                        <_value.%dt>
                    }
                }
            }
        }`
        }
    }
}
var(func: eq(<unigraph.id>, "$/schema/time_frame")) {
    <~type> {
        partf as uid
    }
}
var(func: uid(frames)) {
    <unigraph.origin> {
        res as uid
    }
}`;

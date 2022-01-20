const query = `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @recurse {
    uid
    <unigraph.id>
    expand(_userpredicate_)
}
frames as var(func: uid(partf)) @cascade {
    _value {
        end {
            _value {
                _value {
                    datetime @filter(ge(<_value.%dt>, "${new Date().toJSON()}") AND le(<_value.%dt>, "${new Date(
    new Date().getTime() + 1000 * 60 * 60 * 24,
).toJSON()}")) {
                        <_value.%dt>
                    }
                }
            }
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
const events = (await unigraph.getQueries([query]))?.[0].filter(
    (el) => el?.type?.['unigraph.id'] !== '$/schema/time_frame',
);
return events?.length > 0;

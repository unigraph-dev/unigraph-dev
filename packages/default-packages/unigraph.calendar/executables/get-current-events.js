return `(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_propertyType>, "inheritance"))) @recurse {
    uid
    <unigraph.id>
    expand(_userpredicate_)
}
frames as var(func: type(Entity)) @cascade {
    type @filter(eq(<unigraph.id>, "$/schema/time_frame")) {
        <unigraph.id>
    }
    _value {
        start {
            _value @filter(le(<_value.%dt>, "${(new Date()).toJSON()}")) {
                <_value.%dt>
            }
        }
        end {
            _value @filter(ge(<_value.%dt>, "${(new Date()).toJSON()}")) {
                <_value.%dt>
            }
        }
    }
}
var(func: uid(frames)) {
    <unigraph.origin> {
        res as uid
    }
}`
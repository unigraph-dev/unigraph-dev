import { ListItem, Typography } from "@material-ui/core";
import React from "react"
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";
import { DefaultObjectListView } from "../../components/ObjectView/DefaultObjectView";

export const CurrentEvents = () => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [currentEvents, setCurrentEvents] = React.useState([]);

    React.useEffect(() => {
        const id = getRandomInt();

        window.unigraph.subscribeToQuery(`(func: uid(res)) @filter(type(Entity) AND (NOT type(Deleted)) AND (NOT eq(<_propertyType>, "inheritance"))) @recurse {
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
                    _value @filter(le(<_value.%dt>, "${currentDate.toJSON()}")) {
                        <_value.%dt>
                    }
                }
                end {
                    _value @filter(ge(<_value.%dt>, "${currentDate.toJSON()}")) {
                        <_value.%dt>
                    }
                }
            }
        }
        var(func: uid(frames)) {
            <unigraph.origin> {
                res as uid
            }
        }`, (res: any) => {
            setCurrentEvents(res);
        }, id, true);

        return function cleanup() { window.unigraph.unsubscribe(id); }

    }, [currentDate])

    return <div>
        <Typography>It's currently {currentDate.toString()}!</Typography>
        <Typography>Showing all events before this time:</Typography>
        {currentEvents?.length ? <DefaultObjectListView objects={currentEvents} component={ListItem}/> : "Absolutely nothing"}
    </div>
}
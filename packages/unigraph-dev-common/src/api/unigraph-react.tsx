/**
 * This file specifies related common abstractions when developing front-end apps using React.
 * Users can import this file and use its helper libraries for their own React apps without
 * importing unigraph-dev-explorer.
 * 
 * For some sample usages, see the examples folder in unigraph-dev-explorer.
 */
import React from "react"
import { getRandomInt } from './unigraph';

export function withUnigraphSubscription(WrappedComponent: React.Component, 
    unigraphContext: UnigraphContext, unigraphHooks: UnigraphHooks): React.FC {

    return () => {
        const [subsId, setSubsId] = React.useState(getRandomInt());
        const [data, setData] = React.useState(unigraphContext.defaultData);

        const init = async () => {
            // @ts-ignore
            Promise.all(unigraphContext.schemas.map(el => window.unigraph.ensureSchema(el.name, el.schema)))
                .then(unigraphHooks.afterSchemasLoaded(subsId, setData))
        }

        React.useEffect(() => {
            // Ensure schema is present
            init();

            return function cleanup() {
                // @ts-ignore
                window.unigraph.unsubscribe(subsId);
            };
        }, []);

        // @ts-ignore
        return <WrappedComponent data={data}/>
    }

}
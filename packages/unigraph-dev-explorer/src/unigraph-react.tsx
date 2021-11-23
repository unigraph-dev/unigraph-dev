/**
 * This file specifies related common abstractions when developing front-end apps using React.
 * Users can import this file and use its helper libraries for their own React apps without
 * importing unigraph-dev-explorer.
 * 
 * For some sample usages, see the examples folder in unigraph-dev-explorer.
 */
import React from "react"
import { UnigraphContext, UnigraphHooks } from "unigraph-dev-common/lib/types/unigraph";
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';

export function withUnigraphSubscription(WrappedComponent: React.FC<{data: any}>, 
    unigraphContext: UnigraphContext, unigraphHooks: UnigraphHooks): React.FC {

    return (props) => {
        const [subsId, setSubsId] = React.useState(getRandomInt());
        const [data, setData] = React.useState(unigraphContext.defaultData);

        const init = async () => {
            Promise.all([
                ...unigraphContext.schemas.map(el => (window as any).unigraph.ensureSchema(el.name, el.schema)),
                ...unigraphContext.packages.map(el => (window as any).unigraph.ensurePackage(el.pkgManifest.package_name, el))
            ]).then(unigraphHooks.afterSchemasLoaded(subsId, data, setData))
        }

        React.useEffect(() => {
            // Ensure schema is present
            init();

            return function cleanup() {
                (window as any).unigraph.unsubscribe(subsId);
            };
        }, []);

        return <WrappedComponent {...props} data={data}/>
    }

}

const addViewToRegistry = (state: any, views: Record<string, any>): void => {
    const finalViews = Object.fromEntries(Object.entries(views).map((entry) => entry[1].view ? entry : [entry[0], {view: entry[1]}]));
    state.setValue({...state.value, ...finalViews});
}

export const registerDynamicViews = (views: Record<string, any>): void => {
    const state = (window as any).unigraph.getState('registry/dynamicView');
    addViewToRegistry(state, views);
}

export const getDynamicViews = () => Object.keys((window as any).unigraph.getState('registry/dynamicView').value)

export const registerDetailedDynamicViews = (views: Record<string, any>): void => {
    const state = (window as any).unigraph.getState('registry/dynamicViewDetailed');
    addViewToRegistry(state, views);
}

export const registerQuickAdder = (adders: Record<string, any>): void => {
    const state = (window as any).unigraph.getState('registry/quickAdder');
    state.setValue({...state.value, ...adders});
}

export const registerContextMenuItems = (schema: string, items: any[]): void => {
    const state = (window as any).unigraph.getState('registry/contextMenu');
    state.setValue({...state, [schema]: [...(state[schema] || []), ...items]});
}

const refsMap = {
    "@material-ui/core": () => require('@material-ui/core'),
    "@material-ui/icons": () => require('@material-ui/icons'),
}

const buildRefs = (refs: {env: string, package: string, import: string | undefined, as: string}[]) => {
    const refStrings: any[] = [];
    const refValues: any[] = [];
    refs.forEach(el => {
        if (el.env === "npm" && Object.keys(refsMap).includes(el.package)) {
            refStrings.push(el.as);
            // @ts-expect-error: checked for inclusion
            const module: any = refsMap[el.package]?.();
            refValues.push(el.import ? module[el.import] : module);
        }
    });
    return [refStrings, refValues]
}

export const getComponentFromExecutable = async (data: any, params: any, globalImports: Record<string, any> = {}) => {
    const ret = await (window as any).unigraph.runExecutable(data['unigraph.id'] || data.uid, params, {}, true);
    const imports = (data?.['_value']?.['imports']?.['_value['] || []).map((el: any) => {return {
        env: el?.['_value']?.['env']['_value.%'],
        package: el?.['_value']?.['package']['_value.%'],
        import: el?.['_value']?.['import']?.['_value.%'],
        as: el?.['_value']?.['as']['_value.%'],
    }});
    console.log(imports)
    const [refstr, refval] = buildRefs(imports);
    Object.entries(globalImports).forEach(([key, value]) => {
        refstr.push(key);
        refval.push(value);
    })
    // eslint-disable-next-line no-new-func
    const retFn = new Function('React', ...refstr, 'return ' + ret?.return_function_component)(React, ...refval);
    // Build the component with imports!
    return retFn;
}
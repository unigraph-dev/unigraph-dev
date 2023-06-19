/* eslint-disable global-require */
/**
 * This file specifies related common abstractions when developing front-end apps using React.
 * Users can import this file and use its helper libraries for their own React apps without
 * importing unigraph-dev-explorer.
 *
 * For some sample usages, see the examples folder in unigraph-dev-explorer.
 */
import _ from 'lodash';
import React from 'react';
import { UnigraphContext } from 'unigraph-dev-common/lib/types/unigraph';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import * as HeroIcons from '@heroicons/react/24/outline';
import { TabContext } from './utils';

export function withUnigraphSubscription(
    WrappedComponent: React.FC<{ data: any }>,
    unigraphContext: UnigraphContext,
    unigraphHooks: any,
): React.FC {
    return function (props) {
        const [subsId, setSubsId] = React.useState(getRandomInt());
        const [data, setData] = React.useState(unigraphContext.defaultData);
        const tabContext = React.useContext(TabContext);
        const init = async () => {
            Promise.all([
                ...unigraphContext.schemas.map((el) => (window as any).unigraph.ensureSchema(el.name, el.schema)),
                ...unigraphContext.packages.map((el) =>
                    (window as any).unigraph.ensurePackage(el.pkgManifest.package_name, el),
                ),
            ]).then(unigraphHooks.afterSchemasLoaded(subsId, tabContext, data, setData));
        };

        React.useEffect(() => {
            // Ensure schema is present
            init();

            return function cleanup() {
                tabContext.unsubscribe(subsId);
            };
        }, []);

        return <WrappedComponent {...props} data={data} />;
    };
}

export const useUnigraphState = (name: string) => {
    const [state, setState] = React.useState(window.unigraph.getState(name).value);

    React.useEffect(() => {
        window.unigraph.getState(name).subscribe(setState);

        return () => window.unigraph.getState(name).subscribe(setState);
    }, []);

    return state;
};

const addViewToRegistry = (state: any, views: Record<string, any>): void => {
    const finalViews = Object.fromEntries(
        Object.entries(views).map((entry) => (entry[1].view ? entry : [entry[0], { view: entry[1] }])),
    );
    state.setValue({ ...state.value, ...finalViews });
};

export const subscribeToBacklinks = (uid: string[] | string, callback?: any, remove?: boolean) => {
    const uids = Array.isArray(uid) ? uid : [uid];
    const linksState = window.unigraph.getState('registry/backlinks');
    const newKeys = remove
        ? _.difference(Object.keys(linksState.value), uids)
        : _.uniq([...uids, ...Object.keys(linksState.value)]);
    linksState.setValue(Object.fromEntries(newKeys.map((el) => [el, linksState.value[el]])), true);
    const cbState = window.unigraph.getState('registry/backlinksCallbacks');
    const newCbs = _.uniq([...uids, ...Object.keys(cbState.value)]);
    cbState.setValue(
        Object.fromEntries(
            newCbs.map((el) => [
                el,
                // eslint-disable-next-line no-nested-ternary
                !uids.includes(el)
                    ? cbState.value[el]
                    : // eslint-disable-next-line no-nested-ternary
                    Array.isArray(cbState.value[el])
                    ? remove
                        ? cbState.value[el].filter((cb: any) => cb !== callback)
                        : [...cbState.value[el], callback]
                    : remove
                    ? undefined
                    : [callback],
            ]),
        ),
        true,
    );
};

export const registerDynamicViews = (views: Record<string, any>): void => {
    const state = (window as any).unigraph.getState('registry/dynamicView');
    addViewToRegistry(state, views);
    window.reloadCommands();
};

export const getDynamicViews = () => Object.keys((window as any).unigraph.getState('registry/dynamicView').value);

export const registerDetailedDynamicViews = (views: Record<string, any>): void => {
    const state = (window as any).unigraph.getState('registry/dynamicViewDetailed');
    addViewToRegistry(state, views);
    window.reloadCommands();
};

export const registerQuickAdder = (adders: Record<string, any>): void => {
    const state = (window as any).unigraph.getState('registry/quickAdder');
    state.setValue({
        ...state.value,
        ...adders,
        ...Object.fromEntries(
            Object.values(adders)
                .map((el: any) => (el.alias || []).map((alias: string) => [alias, el]))
                .flat(),
        ),
    });
};

export const registerContextMenuItems = (schema: string, items: any[]): void => {
    const state = (window as any).unigraph.getState('registry/contextMenu');
    state.setValue({
        ...state.value,
        [schema]: [...(state.value?.[schema] || []), ...items],
    });
    window.reloadCommands();
};

const refsMap = {
    '@mui/material': () => require('@mui/material'),
    '@mui/icons-material': () => require('@mui/icons-material'),
    '@mui/lab': () => require('@mui/lab'),
    '@material-ui/core': () => require('@mui/material'),
    '@material-ui/icons': () => require('@mui/icons-material'),
    'react-time-ago': () => require('react-time-ago'),
    'react-markdown': () => require('react-markdown'),
};

const buildRefs = (
    refs: {
        env: string;
        package: string;
        import: string | undefined;
        import_as: string;
    }[],
) => {
    const refStrings: any[] = [];
    const refValues: any[] = [];
    refs.forEach((el) => {
        if (el.env === 'npm' && Object.keys(refsMap).includes(el.package)) {
            refStrings.push(el.import_as);
            // @ts-expect-error: checked for inclusion
            const module: any = refsMap[el.package]?.();
            refValues.push(el.import ? module[el.import] : module);
        }
    });
    return [refStrings, refValues];
};

export const getComponentFromExecutable = async (data: any, params: any, globalImports: Record<string, any> = {}) => {
    const ret = await (window as any).unigraph.runExecutable(data['unigraph.id'] || data.uid, params, {}, true);
    const src = new UnigraphObject(data)?.get('src')?.as('primitive') || '';
    const imports = (data?._value?.imports?.['_value['] || []).map((el: any) => ({
        env: el?._value?.env['_value.%'],
        package: el?._value?.package['_value.%'],
        import: el?._value?.import?.['_value.%'],
        import_as: el?._value?.import_as['_value.%'],
    }));
    const [refstr, refval] = buildRefs(imports);
    Object.entries(globalImports).forEach(([key, value]) => {
        refstr.push(key);
        refval.push(value);
    });
    refstr.push('HeroIcons');
    refval.push(HeroIcons);
    window.twinstance
        .generateStylesFromContent('@tailwind base;\n@tailwind components;\n@tailwind utilities;', [src])
        .then((tailwindStyles: string) => {
            let styleNode = document.querySelector(`#style-${data.uid}`);
            if (!styleNode) {
                styleNode = document.createElement('style');
                styleNode.id = `style-${data.uid}`;
                document.head.appendChild(styleNode);
            }
            styleNode!.innerHTML = tailwindStyles;
        });

    console.log(data.uid, { ret: ret?.return_function_component });
    // eslint-disable-next-line no-new-func
    const retFn = new Function('React', ...refstr, `return ${ret?.return_function_component}`)(React, ...refval);
    // Build the component with imports!
    return retFn;
};

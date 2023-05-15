import { Badge, ListItemIcon, ListItemText } from '@mui/material';
import { PlayArrow, OpenInNew, TrendingFlat, Repeat } from '@mui/icons-material';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global.d';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { DynamicComponentView } from './DynamicComponentView';
import { runClientExecutable } from '../../utils';

export const Executable: DynamicViewRenderer = ({ data, callbacks }) => {
    // console.log(data);
    const unpadded = unpad(data);
    const icons: any = {
        'routine/js': <PlayArrow />,
        'client/js': <PlayArrow />,
        'component/react-jsx': <OpenInNew />,
        'lambda/js': <TrendingFlat />,
    };
    const actions: any = {
        'routine/js': () => {
            window.unigraph.runExecutable(unpadded['unigraph.id'] || data.uid, {});
        },
        'component/react-jsx': () => {
            // Open in new
            window.newTab({
                type: 'tab',
                name: 'Component preview',
                component: `/pages/library/object`,
                enableFloat: 'true',
                config: { uid: data.uid, type: '$/schema/executable' },
            });
        },
        'lambda/js': async () => {
            const res = await window.unigraph.runExecutable(unpadded['unigraph.id'] || data.uid, {});
            console.log(res);
        },
        'client/js': async () => {
            const ret = await window.unigraph.runExecutable(unpadded['unigraph.id'] || data.uid, {});
            if (ret?.return_function_component !== undefined) {
                // Not a component, but custom code to be run here
                runClientExecutable(ret.return_function_component, {
                    uid: unpadded['unigraph.id'] || data.uid,
                    // callbacks,
                    // contextUid,
                });
            }
        },
    };

    return (
        <div className="flex items-center">
            <div
                className="p-0.5 rounded-lg bg-indigo-50 ring-1 ring-gray-200 text-indigo-900"
                onClick={actions[unpadded.env]}
            >
                <div className="scale-75">
                    {unpadded.periodic ? (
                        <Badge
                            overlap="circular"
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            badgeContent={<Repeat fontSize="small" />}
                        >
                            {icons[unpadded.env]}
                        </Badge>
                    ) : (
                        icons[unpadded.env]
                    )}
                </div>
            </div>
            <div className="flex flex-col ml-4">
                <span className="text-sm font-medium text-slate-700">{`${unpadded.name}`}</span>
                <span className="mt-0.5 text-[13px] text-slate-600">{`Environment: ${unpadded.env}`}</span>
            </div>
        </div>
    );
};

export function CodeOrComponentView(props: any) {
    if (
        // eslint-disable-next-line react/destructuring-assignment
        (props.data as any).get('env').as('primitive') === 'component/react-jsx'
    ) {
        return <DynamicComponentView {...props} />;
    }
    return <ExecutableCodeEditor {...props} />;
}

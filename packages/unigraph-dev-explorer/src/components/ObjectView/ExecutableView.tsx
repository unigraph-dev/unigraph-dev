import { ListItemIcon, ListItemText } from '@material-ui/core';
import { PlayArrow, OpenInNew, TrendingFlat } from '@material-ui/icons';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { DynamicViewRenderer } from '../../global.d';
import { ExecutableCodeEditor } from './DefaultCodeEditor';
import { DynamicComponentView } from './DynamicComponentView';

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
            window.newTab(window.layoutModel, {
                type: 'tab',
                name: 'Component preview',
                component: `/pages/${data.uid}`,
                enableFloat: 'true',
                config: {},
            });
        },
        'lambda/js': async () => {
            const res = await window.unigraph.runExecutable(unpadded['unigraph.id'] || data.uid, {});
            console.log(res);
        },
    };

    return (
        <>
            <ListItemIcon style={{ paddingLeft: '8px' }} onClick={actions[unpadded.env]}>
                {icons[unpadded.env]}
            </ListItemIcon>
            <ListItemText primary={`Run code: ${unpadded.name}`} secondary={`Environment: ${unpadded.env}`} />
        </>
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

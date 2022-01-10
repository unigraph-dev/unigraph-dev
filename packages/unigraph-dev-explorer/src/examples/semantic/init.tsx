import { Typography } from '@material-ui/core';
import { registerDetailedDynamicViews, registerDynamicViews, registerQuickAdder } from '../../unigraph-react';
import { BacklinkView } from '../../components/ObjectView/BacklinkView';
import { Html } from './Html';
import { InterfaceSemantic } from './InterfaceSemantic';
import { Markdown } from './Markdown';
import { Tag } from './Tag';

export const init = () => {
    registerDetailedDynamicViews({ '$/schema/html': { view: Html } });
    registerDynamicViews({ '$/schema/markdown': Markdown });
    registerDynamicViews({ '$/schema/tag': { view: Tag } });
    registerDynamicViews({ '$/schema/interface/semantic': InterfaceSemantic });

    registerQuickAdder({
        tag: {
            adder: async (inputStr: string, preview = true) => {
                const parsed = { name: inputStr };
                if (!preview)
                    // eslint-disable-next-line no-return-await
                    return await window.unigraph.addObject(parsed, '$/schema/tag');
                return [parsed, '$/schema/tag'];
            },
            tooltip: () => <Typography>Enter a tag and press Enter</Typography>,
            description: 'Add a tag',
            alias: ['#'],
        },
    });
};

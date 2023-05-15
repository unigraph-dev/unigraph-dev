/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-globals */
import { createTailwindcss } from '@mhsdesign/jit-browser-tailwindcss';
import twConfig from '../tailwind.config';

const tailwindcss = createTailwindcss({ tailwindConfig: twConfig });

self.onmessage = async (e) => {
    const { id, type, payload } = e.data;

    // eslint-disable-next-line no-shadow
    const postMessage = (payload?: any) => {
        self.postMessage({
            id,
            payload,
        });
    };

    switch (type) {
        case 'setTailwindConfig':
            tailwindcss.setTailwindConfig(payload.tailwindConfig);
            postMessage();
            break;

        case 'generateStylesFromContent':
            const css = await tailwindcss.generateStylesFromContent(
                `@tailwind base;
@tailwind components;
@tailwind utilities;`,
                payload.content,
            );
            postMessage(css);
            break;

        default:
            throw new TypeError(`Worker: Invalid type ${type}`);
    }
};

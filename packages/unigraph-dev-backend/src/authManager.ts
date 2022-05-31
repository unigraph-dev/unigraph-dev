/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import path from 'path';

export const processAuthRequest = (method: 'password', value: any) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pass = require(path.join(__dirname, 'secrets.env.json'))?.auth?.password;
    if (!pass) return { success: true };

    if (method === 'password') {
        if (pass === value) return { success: true };
        return { success: false, accepted: ['password'] };
    }

    return { success: true };
};

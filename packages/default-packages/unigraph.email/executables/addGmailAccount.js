const gmailClientId = unigraph.getSecret('google', 'client_id');
const gmailClientSecret = unigraph.getSecret('google', 'client_secret');

const { google } = require('googleapis');

const gmail = google.gmail('v1');
const fetch = require('node-fetch');
const url = require('url');

const oauth2Client = new google.auth.OAuth2(
    gmailClientId,
    gmailClientSecret,
    'http://127.0.0.1:4001/callback?key=gmail',
);

const scopes = ['https://mail.google.com/', 'https://www.googleapis.com/auth/calendar'];

google.options({ auth: oauth2Client });

async function authenticate() {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes.join(' '),
        prompt: 'consent',
    });
    context.send(JSON.stringify({ type: 'open_url', url: authorizeUrl }));

    const oauthResponse = await unigraph.awaitHttpCallback('gmail');
    const { tokens } = await oauth2Client.getToken(oauthResponse.query.code);
    return { bearer: tokens.access_token, refresh: tokens.refresh_token, expiry: tokens.expiry_date };
}

const tokens = await authenticate();

const identityRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/profile?access_token=${tokens.bearer}`);
const json = await identityRes.json();

unigraph.addObject(
    {
        name: json.emailAddress,
        username: json.emailAddress,
        site: {
            name: 'Google',
            url: 'https://www.google.com',
            favicon: 'https://www.google.com/favicon.ico',
        },
        access_token: tokens.bearer,
        token_expires_in: new Date(tokens.expiry).toISOString(),
        refresh_token: tokens.refresh,
    },
    '$/schema/internet_account',
);

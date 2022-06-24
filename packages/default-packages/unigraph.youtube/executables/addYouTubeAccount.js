const Innertube = require('youtubei.js');

const youtube = await new Innertube();

const accounts = (
    await unigraph.getQueries([
        `(func: uid(accUid)) {
    uid
    _youtubeiCredentials
    _youtubeiPending
}
accUid as var(func: uid(parAcc)) @filter((NOT type(Deleted)) AND (NOT eq(<_hide>, true))) @cascade {
    type @filter(eq(<unigraph.id>, "$/schema/internet_account")) {<unigraph.id>}
    _value {
        site {
            _value {
                _value {
                    name @filter(eq(<_value.%>, "Google")) {
                        <_value.%>
                    }
                }
            }   
        }
    }
}
var(func: eq(<unigraph.id>, "$/schema/internet_account")) {
    <~type> { parAcc as uid }
}`,
    ])
)[0];

if (!accounts[0]?.uid || accounts?.length !== 1) {
    console.log(accounts);
    return;
} // Must have one Google account for this to work.
// TODO: handle multiple accounts

let creds;

try {
    creds = JSON.parse(accounts[0]?._youtubeiCredentials || '');
} catch (e) {
    creds = {};
}

youtube.ev.on('auth', (data) => {
    switch (data.status) {
        case 'AUTHORIZATION_PENDING':
            unigraph.updateTriplets([
                `<${accounts[0].uid}> <_youtubeiPending> "${data.verification_url}|${data.code}" .`,
            ]);
            break;
        case 'SUCCESS':
            unigraph.updateObject(
                accounts[0].uid,
                {
                    _youtubeiCredentials: JSON.stringify(data.credentials),
                },
                false,
                false,
            );
            unigraph.updateTriplets([`<${accounts[0].uid}> <_youtubeiPending> * .`], true);
            console.log('Successfully signed in, enjoy!');
            break;
    }
});

youtube.ev.on('update-credentials', (data) => {
    unigraph.updateObject(
        accounts[0].uid,
        {
            _youtubeiCredentials: JSON.stringify(data.credentials),
        },
        false,
        false,
    );
    console.log('Credentials updated!', data);
});

await youtube.signIn(creds);

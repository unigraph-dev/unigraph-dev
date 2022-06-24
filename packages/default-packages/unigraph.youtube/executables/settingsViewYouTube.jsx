const [account, setAccount] = React.useState({});
const tabContext = React.useContext(TabContext);

React.useEffect(() => {
    const id = getRandomInt();
    tabContext.subscribeToQuery(
        `(func: uid(accUid)) {
            uid
            _youtubeiCredentials
            _youtubeiPending
            _value {
                username { <_value.%> }
            }
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
        (res) => {
            setAccount(res[0]);
        },
        id,
        { noExpand: true },
    );
    return function cleanup() {
        tabContext.unsubscribe(id);
    };
}, []);

return (
    <div>
        <Typography variant="h4">YouTube settings</Typography>
        <Button onClick={() => window.unigraph.runExecutable('$/executable/add-youtube-account', {})}>
            Sign in with YouTube
        </Button>
        <Typography variant="body1">Account info</Typography>
        <p>
            <strong>Google account username: </strong>
            {account?.get?.('username').as?.('primitive')}
        </p>
        <p>
            <strong>YouTube credentials </strong>
            {account._youtubeiCredentials}
        </p>
        <Typography variant="body1">Signing in</Typography>
        <p>{account._youtubeiPending}</p>
    </div>
);

import { Button, Typography } from "@material-ui/core"
import React, { useEffect } from "react";
import { useEffectOnce } from "react-use"
import { pkg } from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import { getRandomInt } from "unigraph-dev-common/lib/api/unigraph";

export const EmailSettings = ({}) => {

    const [loaded, setLoaded] = React.useState(false);
    const [account, setAccount] = React.useState<any>({});

    useEffectOnce(() => {
        window.unigraph.ensurePackage("unigraph.email", pkg).then(() => setLoaded(true));
    })

    useEffect(() => {
        if (loaded) {
            const id = getRandomInt();
            window.unigraph.subscribeToQuery(`(func: type(Entity)) @cascade {
                uid
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
                    name { <_value.%> }
                    username { <_value.%> }
                }
            }`, (res: any[]) => {
                setAccount(res[0])
            }, id, true);
            return function cleanup() {
                window.unigraph.unsubscribe(id);
            }
        }
    }, [loaded])

    return loaded ? <div>
        <Typography variant="h4">Email settings (we currently only support Gmail directly; for other inboxes please use the Thunderbird extension)</Typography>
        <Button onClick={() => window.unigraph.runExecutable("$/executable/add-gmail-account", {})}>Sign in with Google</Button>
        <Typography variant="body1">Account info</Typography>
        <p><strong>Name: </strong>{account?.get?.("name").as?.("primitive")}</p>
        <p><strong>Username: </strong>{account?.get?.("username").as?.("primitive")}</p>
    </div> : <React.Fragment>Loading...</React.Fragment>
}
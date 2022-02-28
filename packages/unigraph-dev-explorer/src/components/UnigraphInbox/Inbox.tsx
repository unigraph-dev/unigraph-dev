import _ from 'lodash';
import React from 'react';
import { shouldRemoveEmailOnReadState, shouldMirrorEmailInbox } from '../../examples/email/EmailSettings';
import { Badger } from '../../utils';
import { AutoDynamicViewDetailed } from '../ObjectView/AutoDynamicViewDetailed';

export const inboxRemoveCallback = (uids: string[]) =>
    window.unigraph
        .getQueries(uids.map((el: string) => `(func: uid(${el})) { type { <unigraph.id> } }`))
        .then((res: any[]) => {
            const types = res
                .map((el, index) => ({
                    uid: uids[index],
                    type: el[0]?.type?.['unigraph.id'],
                }))
                .filter((el) => el.type !== undefined);
            // TODO: expand this into more general cases - e.g. over a hook
            const emails = types.filter((el) => el.type === '$/schema/email_message');
            if (emails.length) {
                window.unigraph.runExecutable('$/executable/modify-emails-labels', {
                    uids: emails.map((el) => el.uid),
                    removeLabelIds: shouldMirrorEmailInbox() ? ['INBOX'] : ['UNREAD'],
                    addLabelIds: [],
                });
            }
        });

export function Inbox() {
    const [onUpdate, setOnUpdate] = React.useState(_.noop);

    const removeEmailOnReadState = window.unigraph.getState('settings/email/removeEmailOnRead');
    const [removeEmailOnRead, setRemoveEmailOnRead] = React.useState(removeEmailOnReadState.value);
    removeEmailOnReadState.subscribe((newState: boolean) => {
        setRemoveEmailOnRead(newState);
    });

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pn = urlParams.get('pageName');
        if (pn === 'inbox') {
            const myBadge = new Badger({});
            setOnUpdate(() => (data: any) => {
                const badgeCount = data?._value?.children?.['_value[']?.length || undefined;
                myBadge.value = badgeCount;
            });
        }
    }, []);

    return (
        <AutoDynamicViewDetailed
            object={{
                uid: window.unigraph.getNamespaceMap?.()?.['$/entity/inbox']?.uid,
                _stub: true,
                type: { 'unigraph.id': '$/schema/list' },
            }}
            attributes={{ removeOnEnter: removeEmailOnRead, reverse: true }}
            onLoad={onUpdate}
        />
    );
}

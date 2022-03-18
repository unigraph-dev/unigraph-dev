const uidList = await unigraph.getObject('$/entity/obsidian_synced_notes', {
    queryFn: `(func: uid(QUERYFN_TEMPLATE)) {
        <_value[> {
            <_value> {
              uid
            }
          }
    }`,
});
const uids = uidList['_value['].map((x) => x._value.uid);
return uids;

const { data, callbacks } = params;

const [noteUid, setNoteUid] = React.useState(
    data._value.children['_value['].filter((el) => el._value._value.type?.['unigraph.id'] === '$/schema/note_block')[0]
        ?._value._value.uid,
);

return (
    <div>
        <Card variant="outlined" style={{ margin: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                <Avatar
                    style={{ marginRight: '16px' }}
                    alt={`profile image of ${data?.get('name')?.as('primitive')}`}
                    src={data?.get('profile_image')?.as('primitive')}
                />
                <Typography variant="h5">{data?.get('name')?.as('primitive')}</Typography>
            </div>
            <Typography style={{ marginBottom: '8px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Primary Email</span>
                {data?._value?.emails?.['_value[']?.[0]?.['_value.%'] || 'N/A'}
            </Typography>
            <Typography style={{ marginBottom: '8px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Remarks</span>
                {data?._value?.children?.['_value[']?.map ? (
                    <div style={{ display: 'inline', marginRight: '8px' }}>
                        {data._value.children['_value[']
                            .filter((el) => el._value.type?.['unigraph.id'] === '$/schema/interface/semantic')
                            .map((it) => (
                                <AutoDynamicView
                                    object={new UnigraphObject(it._value)}
                                    callbacks={callbacks}
                                    options={{ inline: true }}
                                    style={{ verticalAlign: 'middle' }}
                                />
                            ))}
                    </div>
                ) : (
                    []
                )}
            </Typography>
            <Typography style={{ marginBottom: '8px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Profiles</span>
                <DynamicObjectListView
                    items={data?._value?.profiles?.['_value['] || []}
                    itemGetter={(el) => el._value._value}
                    context={data}
                    listUid={data?._value?.profiles?.uid}
                    noBar
                    noRemover
                    itemAdder={(uid) => {
                        unigraph.updateObject(
                            data.uid,
                            {
                                profiles: [
                                    {
                                        type: { 'unigraph.id': '$/schema/subentity' },
                                        _value: {
                                            uid,
                                        },
                                    },
                                ],
                            },
                            true,
                            true,
                        );
                    }}
                    itemRemover={(uids) => {
                        window.unigraph.deleteItemFromArray(listUid, uids, data.uid);
                    }}
                />
            </Typography>
        </Card>
        <Card variant="outlined" style={{ margin: '16px' }}>
            <Typography gutterBottom style={{ paddingLeft: '16px', paddingTop: '16px' }}>
                Notes
            </Typography>
            {noteUid ? (
                <div style={{ margin: '-16px', marginBottom: '16px' }}>
                    <AutoDynamicViewDetailed
                        object={{ uid: noteUid, _stub: true, type: { 'unigraph.id': '$/schema/note_block' } }}
                        attributes={{ noText: true, noReferences: true }}
                    />
                </div>
            ) : (
                <Button
                    style={{ margin: '16px' }}
                    variant="outlined"
                    onClick={async () => {
                        const newNoteUid = unigraph.leaseUid();
                        await unigraph.updateObject(
                            data.uid,
                            {
                                children: [
                                    {
                                        type: { 'unigraph.id': '$/schema/subentity' },
                                        _value: {
                                            type: { 'unigraph.id': '$/schema/note_block' },
                                            _value: {
                                                $context: {
                                                    uid: newNoteUid,
                                                },
                                                text: {
                                                    _value: data?.get('name')?.as('primitive') || '',
                                                    type: { 'unigraph.id': '$/schema/markdown' },
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                            undefined,
                            undefined,
                            callbacks.subsId,
                            [{ uid: data.uid }],
                        );
                        setNoteUid(newNoteUid);
                    }}
                >
                    + Add note
                </Button>
            )}
        </Card>
        <div style={{ margin: '16px' }}>
            <Typography>Backlinks</Typography>
            <BacklinkView data={data} hideHeader />
        </div>
    </div>
);

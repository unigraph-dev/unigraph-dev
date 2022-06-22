const { data, callbacks, ...props } = params;
return (
    <div>
        <div style={{ display: 'flex' }}>
            <div
                style={{
                    height: '24px',
                    width: '24px',
                    transform: 'scale(0.583)',
                    marginRight: '4px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' style='width:24px;height:24px' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M18.5,1.15C17.97,1.15 17.46,1.34 17.07,1.73L11.26,7.55L16.91,13.2L22.73,7.39C23.5,6.61 23.5,5.35 22.73,4.56L19.89,1.73C19.5,1.34 19,1.15 18.5,1.15M10.3,8.5L4.34,14.46C3.56,15.24 3.56,16.5 4.36,17.31C3.14,18.54 1.9,19.77 0.67,21H6.33L7.19,20.14C7.97,20.9 9.22,20.89 10,20.12L15.95,14.16' /%3E%3C/svg%3E")`,
                }}
            />{' '}
            {new UnigraphObject(data._value.source._value['unigraph.indexes'])?.get('name')?.as('primitive')}
        </div>
        <div
            style={{
                marginTop: '4px',
                marginLeft: '5px',
                borderLeft: `4px solid ${data.get('color').as('primitive')}`,
                paddingLeft: '18px',
            }}
        >
            {data.get('text').as('primitive')}
        </div>
        <div style={{ marginLeft: '27px' }}>
            <AutoDynamicView
                object={data.get('notes/text')?._value?._value}
                key="name"
                options={{ noDrag: true, noDrop: true, noContextMenu: true }}
                callbacks={{
                    'get-semantic-properties': () => data.get('notes')?._value,
                }}
            />
        </div>
    </div>
);

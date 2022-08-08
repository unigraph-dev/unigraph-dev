export const UnigraphRecovery = () => {
    return (
        <div
            style={{
                position: 'absolute',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <img src="/logo192.png" style={{ height: '96px', width: '96px', marginBottom: '24px' }} />
            <div style={{ fontFamily: 'sans-serif', fontSize: '20px', marginBottom: '16px' }}>Unigraph Recovery</div>
            <div style={{ marginBottom: '8px' }}>Background sync and third-party apps are disabled.</div>
            <div style={{ fontFamily: 'sans-serif', color: '#707070' }}>Open Developer Console to continue.</div>
        </div>
    );
};

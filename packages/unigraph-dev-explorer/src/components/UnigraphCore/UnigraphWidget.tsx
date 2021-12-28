import { Card } from '@material-ui/core';

export function UnigraphWidget({ children, style }: any) {
    return (
        <Card variant="outlined" style={{ height: '100%', padding: '16px', ...style }}>
            {children}
        </Card>
    );
}

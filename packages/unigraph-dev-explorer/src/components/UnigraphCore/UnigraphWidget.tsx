import { Card } from '@mui/material';

export function UnigraphWidget({ children, style }: any) {
    return (
        <Card variant="outlined" style={{ height: '100%', padding: '16px', ...style }} className="unigraph-widget">
            {children}
        </Card>
    );
}

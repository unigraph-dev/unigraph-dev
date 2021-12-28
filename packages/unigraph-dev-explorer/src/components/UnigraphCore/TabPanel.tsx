import { Box, Typography } from '@material-ui/core';

export function TabPanel({
    children, value, index, ...other
}: any) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
            <Box>
                <Typography>{children}</Typography>
            </Box>
            )}
        </div>
    );
}

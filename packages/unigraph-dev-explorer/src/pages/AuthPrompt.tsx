import {
    Button,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';

export const AuthPrompt = () => {
    const [authState, setAuthState] = React.useState(undefined);
    React.useEffect(() => window.unigraph.getState('unauthorized').subscribe(setAuthState), []);

    const [password, setPassword] = React.useState('');
    const handleClose = React.useCallback(() => {
        window.localStorage.setItem('password', password);
        document.location.reload();
    }, [password]);

    return authState ? (
        <Dialog open={!!authState} onClose={handleClose}>
            <DialogTitle>Authenticate</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <Typography>Accepted auth methods: {(authState as any)?.accepted}</Typography>
                    <Typography>
                        Warning: using passwords is less secure than OAuth. This password will be saved in your browser.
                    </Typography>
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="standard"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Submit</Button>
            </DialogActions>
        </Dialog>
    ) : null;
};

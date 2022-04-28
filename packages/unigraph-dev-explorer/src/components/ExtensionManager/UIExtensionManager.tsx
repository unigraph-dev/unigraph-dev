import { Add, ArrowRightOutlined } from '@mui/icons-material';
import {
    Button,
    Checkbox,
    Divider,
    Drawer,
    FormControl,
    FormLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    OutlinedInput,
    Typography,
} from '@mui/material';
import React from 'react';
import { pointerHoverSx } from '../../utils';
import { AutoDynamicView } from '../ObjectView/AutoDynamicView';

export const extensionTypes = [
    '$/schema/command_handler',
    '$/schema/command',
    '$/schema/home_section',
    '$/schema/context_menu_item',
    '$/schema/view',
];

const labelStyle = { flexDirection: 'row', alignItems: 'center', gap: '8px', display: 'flex', margin: '8px 0px' };

const executableView = (name: string, uid: string) => ({
    env: 'component/react-jsx',
    src: '',
    editable: true,
    name,
    uid,
});

export const SchemaViewAdder = () => {
    const [icon, setIcon] = React.useState('');
    const [name, setName] = React.useState('');
    const [env, setEnv] = React.useState('react-explorer');
    const [isShortcut, setIsShortcut] = React.useState(false);

    const [addedUid, setAddedUid] = React.useState<any>();
    const [added, setAdded] = React.useState<any>();

    return (
        <div>
            <Typography variant="h6" gutterBottom>
                Add new view
            </Typography>
            <Typography gutterBottom>
                This will also be seen in the &quot;app shortcuts&quot; home card if the shortcut option is selected.{' '}
            </Typography>
            <List dense>
                <FormControl size="small" sx={labelStyle}>
                    <FormLabel>Name</FormLabel>
                    <OutlinedInput
                        placeholder="Name of the view"
                        value={name}
                        onChange={(ev) => setName(ev.target.value)}
                    />
                </FormControl>
                <FormControl size="small" sx={labelStyle}>
                    <FormLabel>Icon</FormLabel>

                    <OutlinedInput
                        placeholder="Icon (in SVG string)"
                        value={icon}
                        onChange={(ev) => setIcon(ev.target.value)}
                    />
                    <ArrowRightOutlined />
                    <ListItemIcon
                        style={{
                            minWidth: '24px',
                            minHeight: '24px',
                            backgroundImage: `${
                                icon?.startsWith('data:image/svg+xml,') ? '' : 'url("data:image/svg+xml,'
                            }${icon}")`,
                            opacity: 0.54,
                            border: '1px solid var(--secondary-text-color)',
                            borderRadius: '4px',
                        }}
                    />
                </FormControl>
                <FormControl size="small" sx={labelStyle}>
                    <FormLabel>Env</FormLabel>
                    <OutlinedInput
                        placeholder="Env of the view (default should be fine)"
                        value={env}
                        onChange={(ev) => setEnv(ev.target.value)}
                    />
                </FormControl>
                <FormControl size="small" sx={labelStyle}>
                    <FormLabel>App shortcut</FormLabel>
                    <Checkbox checked={isShortcut} onChange={(ev) => setIsShortcut(ev.target.checked)} />
                </FormControl>
            </List>
            <Divider />
            <Button
                variant="contained"
                onClick={async () => {
                    const executableUid = (window.unigraph as any).leaseUid();
                    window.unigraph.addObject(
                        {
                            env,
                            name,
                            icon,
                            view: executableView(name, executableUid),
                            ...(isShortcut ? { $context: { _isShortcut: true } } : {}),
                        },
                        '$/schema/view',
                    );
                    setAddedUid(executableUid);
                }}
            >
                Add
            </Button>
            {addedUid ? (
                <div>
                    <Typography>Go to code editor to edit</Typography>
                    <AutoDynamicView
                        object={{
                            _stub: true,
                            uid: addedUid,
                            type: { 'unigraph.id': '$/schema/executable' },
                        }}
                    />
                </div>
            ) : (
                ''
            )}
        </div>
    );
};

export const editors = {
    '': () => <Typography style={{ alignSelf: 'center' }}>Click &quot;Add&quot; to add new UI Extensions</Typography>,
    '$/schema/view': SchemaViewAdder,
};

export const UIExtensionManager = () => {
    const [selected, setSelected] = React.useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
            <div style={{ flexShrink: 0, height: '100%', overflowY: 'auto' }}>
                <Drawer
                    variant="permanent"
                    anchor="left"
                    sx={{
                        width: '100%',
                        height: '100%',
                        overflow: 'auto',
                        minWidth: '280px',
                        flexShrink: 0,
                    }}
                >
                    <List dense>
                        <ListItem
                            sx={pointerHoverSx}
                            onClick={() => {
                                setSelected('$/schema/view');
                            }}
                            selected={selected === '$/schema/view'}
                        >
                            <ListItemIcon>
                                <Add />
                            </ListItemIcon>
                            <ListItemText primary="New view" />
                        </ListItem>
                    </List>
                    WIP
                </Drawer>
            </div>
            <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', paddingTop: '16px' }}>
                {React.createElement((editors as any)[selected])}
            </div>
        </div>
    );
};

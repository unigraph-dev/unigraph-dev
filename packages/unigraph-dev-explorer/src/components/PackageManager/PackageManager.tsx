import { Button, FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext, upload } from '../../utils';
import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

const corePackages = [
    'unigraph.semantic',
    'unigraph.core',
    'unigraph.coreuser',
    'unigraph.home',
    'unigraph.onboarding',
];

export const PackageManifestView = ({ data }: any) => {
    const pkgName = data?.get('package_name')?.as('primitive');
    return (
        <Paper variant="outlined" style={{ margin: '4px', padding: '16px', width: '100%' }}>
            <Typography style={{ marginBottom: '6px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Name</span>
                {data?.get('name')?.as('primitive')}
            </Typography>
            <Typography style={{ marginBottom: '6px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Description</span>
                {data?.get('description')?.as('primitive')}
            </Typography>
            <Typography style={{ marginBottom: '6px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Package name</span>
                {pkgName}
            </Typography>
            <Typography style={{ marginBottom: '6px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Version</span>
                {data?.get('version')?.as('primitive')}
            </Typography>
            <FormControlLabel
                style={{
                    display: pkgName && corePackages.includes(pkgName) ? 'none' : '',
                }}
                control={
                    <Switch
                        checked={!data._hide}
                        onChange={() =>
                            data._hide
                                ? window.unigraph.enablePackage?.(pkgName)
                                : window.unigraph.disablePackage?.(pkgName)
                        }
                        name="disableOrEnablePackage"
                    />
                }
                label={`Click to ${data._hide ? 'enable' : 'disable'} package`}
            />
        </Paper>
    );
};

export const PackageManager: React.FC = ({}) => {
    const [packages, setPackages]: any = React.useState([]);
    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const id = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/package_manifest',
            (pkgs: any[]) => {
                setPackages(pkgs);
            },
            id,
            { showHidden: true },
        );

        return () => {
            tabContext.unsubscribe(id);
        };
    }, []);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography gutterBottom variant="h4">
                Package Manager
            </Typography>
            <div>
                <Button
                    onClick={() => {
                        upload((file: File) => {
                            file.text().then((pkg: string) => {
                                try {
                                    // eslint-disable-next-line no-new-func
                                    const pkgModule = new Function(
                                        `let exports = {pkg: undefined};${pkg}return exports.pkg`,
                                    )();
                                    console.log(pkgModule);
                                    window.unigraph.addPackage?.(pkgModule, true);
                                } catch (e) {
                                    console.error('Add package failure!');
                                    console.error(e);
                                }
                            });
                        });
                    }}
                >
                    Add package (overwrite)
                </Button>
            </div>
            <DynamicObjectListView
                items={packages}
                context={null}
                defaultFilter={['no-noview', 'no-deleted', 'no-trivial']}
                compact
            />
        </div>
    );
};

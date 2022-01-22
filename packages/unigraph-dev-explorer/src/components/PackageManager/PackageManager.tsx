import { Button, Paper, Typography } from '@material-ui/core';
import React from 'react';
import { getRandomInt } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext, upload } from '../../utils';
import { DynamicObjectListView } from '../ObjectView/DynamicObjectListView';

export const PackageManifestView = ({ data }: any) => {
    return (
        <Paper variant="outlined" style={{ margin: '4px', padding: '16px', width: '100%' }}>
            <Typography style={{ marginBottom: '8px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Name</span>
                {data?.get('name')?.as('primitive')}
            </Typography>
            <Typography style={{ marginBottom: '8px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Description</span>
                {data?.get('description')?.as('primitive')}
            </Typography>
            <Typography style={{ marginBottom: '8px' }}>
                <span style={{ color: 'gray', marginRight: '8px' }}>Package name</span>
                {data?.get('package_name')?.as('primitive')}
            </Typography>
            <Typography>
                <span style={{ color: 'gray', marginRight: '8px' }}>Version</span>
                {data?.get('version')?.as('primitive')}
            </Typography>
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
            <DynamicObjectListView items={packages} context={null} compact />
        </div>
    );
};

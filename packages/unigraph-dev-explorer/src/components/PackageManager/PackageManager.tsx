import { Button, Typography } from '@material-ui/core';
import React from 'react';
import { DataGrid } from '@material-ui/data-grid';
import { deselectUid, selectUid, upload } from '../../utils';
import { isJsonString } from 'unigraph-dev-common/lib/utils/utils';

export const PackageManager: React.FC = ({}) => {
    const [packages, setPackages]: any = React.useState([])

    React.useEffect(() => {
        window.unigraph.getPackages().then((pkg: any) => {
            setPackages(Object.values(pkg)) 
        })
    }, [])

    return <div style={{height: 800}}>
        <Typography gutterBottom variant="h4">
            Package Manager
        </Typography>
        <div>
            <Button onClick={() => {upload((file: File) => {file.text().then((pkg: string) => {
                try {
                    // eslint-disable-next-line no-new-func
                    const pkgModule = new Function("let exports = {pkg: undefined};" + pkg + "return exports.pkg")();
                    console.log(pkgModule);
                    window.unigraph.addPackage?.(pkgModule, true)
                } catch (e) {
                    console.error("Add package failure!");
                    console.error(e);
                }
            })})}}>Add package (overwrite)</Button>
        </div>
        <DataGrid columns={[
            {field: 'package_name', headerName: 'Package Name', width: 200},
            {field: 'name', headerName: "Name", width: 150},
            {field: 'description', headerName: "Description", width: 250},
            {field: 'version', headerName: "Ver", width: 75},
            {field: 'schemaLen', headerName: "Schemas", width: 120, type: 'number'},
            {field: 'execLen', headerName: "Executables", width: 135, type: 'number'},
        ]} rows={packages.map((pkg: any) => {return {...pkg.pkgManifest, schemaLen: pkg.pkgSchemas ? Object.keys(pkg.pkgSchemas).length-1 : 0, execLen: pkg.pkgExecutables ? Object.keys(pkg.pkgExecutables).length-1 : 0}})} getRowId={row => row.package_name} pageSize={15}
        onRowSelected={(param) => {
            deselectUid();
            selectUid(param.data.uid);
        }}
        />
    </div>
}
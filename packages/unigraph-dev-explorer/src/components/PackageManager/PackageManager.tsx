import { List, ListItem, Typography } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { PackageDeclaration } from 'unigraph-dev-common/lib/types/packages';
import { DataGrid } from '@material-ui/data-grid';

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
        <DataGrid columns={[
            {field: 'pkgPackageName', headerName: 'Package Name', width: 200},
            {field: 'pkgDisplayName', headerName: "Name", width: 150},
            {field: 'pkgDescription', headerName: "Description", width: 250},
            {field: 'pkgVersion', headerName: "Version", width: 100},
            {field: 'schemaLen', headerName: "Schemas", width: 100, type: 'number'}
        ]} rows={packages.map((pkg: any) => {return {...pkg.pkgManifest, schemaLen: Object.keys(pkg.pkgSchemas).length-1}})} getRowId={row => row.pkgPackageName} pageSize={10}/>
    </div>
}
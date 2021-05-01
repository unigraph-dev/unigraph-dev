import { List, ListItem, Typography } from '@material-ui/core';
import React from 'react';
import { useEffectOnce } from 'react-use';
import { PackageDeclaration } from 'unigraph-dev-common/lib/types/packages';
import { DataGrid } from '@material-ui/data-grid';

export const PackageManager: React.FC = ({}) => {
    const [packages, setPackages]: any = React.useState([])

    React.useEffect(() => {
        window.unigraph.getPackages().then((pkg: any) => {
            pkg = Object.values(pkg).map((el: any) => {el.pkgManifest = window.unigraph.unpad(el.pkgManifest); return el})
            setPackages(pkg) 
        })
    }, [])

    return <div style={{height: 800}}>
        <Typography gutterBottom variant="h4">
            Package Manager
        </Typography>
        <DataGrid columns={[
            {field: 'package_name', headerName: 'Package Name', width: 200},
            {field: 'name', headerName: "Name", width: 150},
            {field: 'description', headerName: "Description", width: 250},
            {field: 'version', headerName: "Version", width: 100},
            {field: 'schemaLen', headerName: "Schemas", width: 100, type: 'number'}
        ]} rows={packages.map((pkg: any) => {return {...pkg.pkgManifest, schemaLen: Object.keys(pkg.pkgSchemas).length-1}})} getRowId={row => row.package_name} pageSize={10}/>
    </div>
}
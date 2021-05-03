import { Typography } from '@material-ui/core';
import React from 'react';
import { DataGrid } from '@material-ui/data-grid';

export const PackageManager: React.FC = ({}) => {
    const [packages, setPackages]: any = React.useState([])

    React.useEffect(() => {
        window.unigraph.getPackages().then((pkg: any) => {
            console.log(Object.values(pkg))
            setPackages(Object.values(pkg)) 
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
        ]} rows={packages.map((pkg: any) => {return {...pkg.pkgManifest, schemaLen: pkg.pkgSchemas ? Object.keys(pkg.pkgSchemas).length-1 : 0}})} getRowId={row => row.package_name} pageSize={10}/>
    </div>
}
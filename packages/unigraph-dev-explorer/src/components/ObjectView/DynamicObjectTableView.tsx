/* eslint-disable react/require-default-props */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sugar from 'sugar';

import 'ag-grid-enterprise';

import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component

import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { TabContext } from '../../utils';
import { AutoDynamicView } from './AutoDynamicView';
import { onUnigraphContextMenu } from './DefaultObjectContextMenu';

function TypeRenderer({ value }: any) {
    return (
        <div style={{ display: 'flex', height: '100%' }}>
            <div
                className="type-renderer"
                style={{
                    minHeight: '18px',
                    minWidth: '18px',
                    height: '18px',
                    width: '18px',
                    alignSelf: 'center',
                    marginRight: '3px',
                    opacity: 0.54,
                    backgroundImage: `url("data:image/svg+xml,${value}")`,
                }}
            />
        </div>
    );
}

function DateRenderer({ value }: any) {
    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', color: 'gray' }}>
            {value ? Sugar.Date.relative(new Date(value)) : ''}
        </div>
    );
}

function OrdinalRenderer({ value }: any) {
    const handleContextMenu = React.useCallback(
        (event) => {
            onUnigraphContextMenu(event, value[1], value[2]);
        },
        [value],
    );

    return (
        <div
            style={{
                display: 'flex',
                height: '100%',
                fontFamily: '"SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace',
                fontSize: '13px',
                color: 'gray',
                justifyContent: 'right',
            }}
            onClick={handleContextMenu}
            onContextMenu={handleContextMenu}
        >
            {value[0]}
        </div>
    );
}

function ADVRenderer({ value, ...args }: any) {
    if (Array.isArray(value)) {
        return (
            <div style={{ display: 'flex', height: '100%' }}>
                {value.map((el) =>
                    el?._value ? (
                        <AutoDynamicView
                            object={el}
                            style={{ fontSize: '14px' }}
                            options={{ inline: true, noBacklinks: true }}
                        />
                    ) : (
                        el?.['_value.%']
                    ),
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            {value?._value ? (
                <AutoDynamicView
                    object={value._value}
                    style={{ fontSize: '14px' }}
                    options={{ inline: true, noBacklinks: true }}
                />
            ) : (
                value?.['_value.%']
            )}
        </div>
    );
}

export const DynamicObjectTableView = ({
    items,
    inline,
    context,
}: {
    items: any[];
    inline?: boolean;
    context?: any;
}) => {
    const gridRef = useRef<any>(); // Optional - for accessing Grid's API
    const [rowData, setRowData] = useState<any[]>(); // Set rowData to Array of Objects, one Object per Row

    // Each Column Definition results in one Column.
    const [columnDefs, setColumnDefs] = useState([
        ...(context
            ? [
                  {
                      field: '#',
                      colId: 'ordinalNum',
                      cellRenderer: OrdinalRenderer,
                      width: 54,
                      keyCreator: (params: any) => params.value[0],
                  },
              ]
            : []),
        { field: 'type', cellRenderer: TypeRenderer, width: 40 },
        {
            field: 'name',
            cellRenderer: ADVRenderer,
            flex: 1,
            keyCreator: (params: any) => {
                const res = new UnigraphObject(params.value)?.as('primitive');
                return res;
            },
            comparator: (valueA: any, valueB: any) => {
                return new UnigraphObject(valueA)?.as('primitive') > new UnigraphObject(valueB)?.as('primitive')
                    ? 1
                    : -1;
            },
        },
        {
            field: 'tags',
            cellRenderer: ADVRenderer,
            keyCreator: (params: any) => {
                const tags = params.value.map((el: any) => new UnigraphObject(el)?.get('name')?.as('primitive') || '');
                return tags.join(', ');
            },
        },
        { field: 'updatedAt', headerName: 'Updated', cellRenderer: DateRenderer },
        { field: 'createdAt', headerName: 'Created', cellRenderer: DateRenderer, hide: true },
    ]);

    // DefaultColDef sets props common to all Columns
    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            resizable: true,
            filter: true,
        }),
        [],
    );

    const tabContext = React.useContext(TabContext);

    // Example load data from sever
    useEffect(() => {
        const subsId = getRandomInt();

        tabContext.subscribeToObject(
            items.map((el) => el.uid),
            (data: any[]) => {
                const resMap: any = {};
                ((Array.isArray(data) ? data : [data]) || []).forEach((el: any) => {
                    resMap[el.uid] = el;
                });
                setRowData(
                    items.map((el, idx) => ({
                        '#': [idx, resMap[el.uid], context],
                        type: window.unigraph.getNamespaceMap?.()[resMap[el.uid]?.type?.['unigraph.id']]?._icon,
                        uid: el.uid,
                        name: resMap[el.uid]?.['unigraph.indexes']?.name,
                        tags: (resMap[el.uid]?._value?.children?.['_value['] || [])
                            .map((ell: any) => ell._value._value)
                            .filter((ell: any) => ell.type?.['unigraph.id'] === '$/schema/tag'),
                        updatedAt: new Date(resMap[el.uid]?._updatedAt).getTime() || 0,
                        createdAt: new Date(resMap[el.uid]?._createdAt).getTime() || 0,
                    })),
                );
            },
            subsId,
            {
                queryFn: `(func: uid(QUERYFN_TEMPLATE)) {
                    uid
                    _updatedAt
                    _createdAt
                    type { <unigraph.id> }
                    _value {
                        children {
                            <_value[> {
                                _value {
                                    _value {
                                        uid
                                        type { uid <unigraph.id> }
                                        _value {
                                            name {
                                                <_value.%>
                                            }
                                            color {
                                                _value {
                                                    <_value.%>
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    unigraph.indexes {
                        uid
                        name { uid <unigraph.id> expand(_userpredicate_) { uid <unigraph.id> expand(_userpredicate_) { 
                          uid <unigraph.id> expand(_userpredicate_) { uid <unigraph.id> expand(_userpredicate_) { uid <unigraph.id> expand(_userpredicate_) } } } } }
                    }
                }`,
            },
        );
    }, []);

    return (
        <div style={{ display: 'contents' }} className="ag-theme-alpine">
            <AgGridReact
                ref={gridRef} // Ref for accessing Grid's API
                rowData={rowData} // Row Data for Rows
                columnDefs={columnDefs} // Column Defs for Columns
                defaultColDef={defaultColDef} // Default Column Properties
                onFirstDataRendered={(ev) => {
                    ev.columnApi.autoSizeColumns(['ordinalNum', 'updatedAt', 'createdAt'], true);
                    ev.columnApi.setColumnWidth(
                        'ordinalNum',
                        (ev.columnApi.getColumn('ordinalNum')?.getActualWidth() || 74) - 20,
                    );
                }}
                animateRows // Optional - set to 'true' to have rows animate when sorted
                rowSelection="multiple" // Options - allows click selection of rows
                sideBar={{
                    toolPanels: ['columns', 'filters'],
                }}
                groupDisplayType="singleColumn"
                domLayout={inline ? 'autoHeight' : 'normal'}
                suppressContextMenu
            />
        </div>
    );
};

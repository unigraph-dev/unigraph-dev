import { Chip } from "@material-ui/core";
import { mdiPlayOutline } from "@mdi/js";
import React from "react";
import Icon from '@mdi/react'

export const SubentityView = ({data, callbacks}: any) => {
    const [isMain, setIsMain] = React.useState(false);
    const [subEntities, setSubentities] = React.useState(1);

    React.useEffect(() => {
        if (!callbacks.addSubentity) {
            callbacks.addSubentity = () => setSubentities(subEntities + 1);
            setIsMain(true);
        } else {
            callbacks.addSubentity();
        }
    }, [])

    return isMain ? <Chip
        size="small"
        icon={<Icon path={mdiPlayOutline} size={0.75}/>}
        variant={"outlined"}
        label={"Expand " + subEntities + " subentities"}
        onClick={() => {
            callbacks?.showSubentities?.();
        }}
    /> : []

}
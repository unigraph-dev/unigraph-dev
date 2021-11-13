import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView";
import { DynamicViewRenderer } from "../../global";

export const InterfaceSemantic: DynamicViewRenderer = ({data, callbacks}) => {
    return <AutoDynamicView
        object={data['_value']}
        callbacks={callbacks}
    />
}
import { registerDetailedDynamicViews, registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { BacklinkView } from "../../components/ObjectView/BacklinkView";
import { Html } from "./Html";
import { InterfaceSemantic } from "./InterfaceSemantic";
import { Markdown } from "./Markdown";

export const init = () => {
    registerDetailedDynamicViews({"$/schema/html": Html});
    registerDetailedDynamicViews({"$/schema/tag": BacklinkView});
    registerDetailedDynamicViews({"$/schema/markdown": Markdown});
    registerDynamicViews({"$/schema/markdown": Markdown});
    registerDynamicViews({"$/schema/interface/semantic": InterfaceSemantic})
}
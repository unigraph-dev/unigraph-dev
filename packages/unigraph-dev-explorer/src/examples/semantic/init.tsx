import { registerDetailedDynamicViews, registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { Html } from "./Html";
import { Markdown } from "./Markdown";

export const init = () => {
    registerDetailedDynamicViews({"$/schema/html": Html});
    registerDetailedDynamicViews({"$/schema/markdown": Markdown});
    registerDynamicViews({"$/schema/markdown": Markdown});
}
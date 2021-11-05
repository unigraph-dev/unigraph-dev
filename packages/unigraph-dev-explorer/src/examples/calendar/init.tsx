import { registerDynamicViews } from "unigraph-dev-common/lib/api/unigraph-react";
import { CalendarEvent } from "./Calendar";

export const init = () => {
    registerDynamicViews({"$/schema/calendar_event": CalendarEvent as any});
}
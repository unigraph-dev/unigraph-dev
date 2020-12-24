import { Cache } from "./caches";
import { Subscription } from "./subscriptions";

export type Hooks = Record<string, Function[]>

export function callHooks<T>(hooks: Hooks, type: string, context: T) {
    if (Object.keys(hooks).includes(type)) hooks[type].forEach(val => val(context));
}

// Default hooks
export type HookAfterSubscriptionAddedParams = { 
    newSubscriptions: Subscription[],
}

export type HookAfterSchemaUpdatedParams = {
    newCaches: Record<string, Cache>,
}

export type HookAfterObjectChangedParams = {
    subscriptions: Subscription[],
    caches: Record<string, Cache>,
}
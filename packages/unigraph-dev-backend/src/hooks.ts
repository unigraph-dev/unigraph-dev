import { Cache } from "./caches";
import { Subscription } from "./subscriptions";

/* eslint-disable */ // TODO: Temporarily appease the linter, remember to fix it later
export type Hooks = Record<string, Function[]>

export async function callHooks<T>(hooks: Hooks, type: string, context: T) {
    if (Object.keys(hooks).includes(type)) await Promise.all(hooks[type].map(val => val(context)));
}

// Default hooks
export type HookAfterSubscriptionAddedParams = { 
    subscriptions: Subscription[],
    ids?: any[] | undefined,
}

export type HookAfterSchemaUpdatedParams = {
    caches: Record<string, Cache<any>>,
}

export type HookAfterObjectChangedParams = {
    subscriptions: Subscription[],
    caches: Record<string, Cache<any>>,
}
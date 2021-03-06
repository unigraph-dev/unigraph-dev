import { RefUnigraphIdType } from "unigraph-dev-common/lib/types/json-ts";

export interface KeyValueField<K = any, V = any> {
  key: K;
  value: V;
}

export type KeyValueInput<K = any, V = any> = Partial<KeyValueField<K, V>>;

/**
 * TODO: common package for shared types & enums
 */

export type EntityField<T extends string = string> = {
  _key: string;
  _definition: {
    type?: RefUnigraphIdType<T>;
    _parameters?: {
      _element: {
        type: RefUnigraphIdType<T>;
      }
    }
  };
}

export type EntityFieldInput<T extends string = string> = {
  _key: string,
  _definition: { type: string }
}
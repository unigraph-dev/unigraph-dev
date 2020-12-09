export interface KeyValueField<K = any, V = any> {
  key: K;
  value: V;
}

export type KeyValueInput<K = any, V = any> = Partial<KeyValueField<K, V>>;

/**
 * TODO: common package for shared types & enums
 */

type RefUnigraphIdType<UID extends string = string> = {
  $ref: {
    key: 'unigraph.id',
    query: UID
  }
};

export type EntityField<T extends string = string> = {
  key: string;
  definition: {
    type: RefUnigraphIdType<T>;
    parameters?: {
      element: {
        type: RefUnigraphIdType<T>;
      }
    }
  };
}

export function makeUnigraphId(id: string) {
  return { 'unigraph.id': id }
}

export function makeRefUnigraphId(id: string): RefUnigraphIdType {
  return {
    "$ref": {
      "key": "unigraph.id",
      "query": id,
    }
  };
}

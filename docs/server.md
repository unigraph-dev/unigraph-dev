# unigraph-dev Server API

We use a websocket-based API for our server. To interact with the server, first establish a connection with the local server (default address is `ws://localhost:3000`).

After establishing the connection, you can use the event system of the server, either by sending events to the server or listening to updates (subscribing to events).

To send a event to the server, follow the event syntax such as:

```json
{
    "type": "event",
    "event": "query_by_string_with_vars",
    "query": "query findByName($a: string) {\n        entities(func: eq(name, $a)) {\n          uid\n          name\n          definition @filter(eq(name, \"Owner\")) {\n            name\n          }\n          otherField {\n            notDefined\n          }\n        }\n      }",
    "vars": {
        "$a": "TODO Model"
    },
    "id": 1
}
```

For more information on the various events and subscriptions, check out the documentation below:

## Events

To send an event, use `"type": "event"` and `"event": "<name of the event to send>"`. Here is a list of available events:

Fore more information on how to write these events, refer to the `custom.d.ts` type declaration.

- Database operations
    * query_by_string_with_vars `{"query": "<query string>", "vars": {<maps of all vars>}}`
    * set_dgraph_schema `{"schema": "<a schema string>"}`
    * create_data_by_json
    * drop_data (no parameters needed)
    * drop_all (no parameters needed)
    * create_unigraph_schema
    * create_unigraph_object
- Administrative events
- Statistics and logging

```json
{
    "type": "event",
    "event": "create_unigraph_schema",
    "data": {
        // Your schema here, use an array if there are multiple schemas
    },
    "id": 1
}
```

For more detailed info regarding each of the events, TODO

## Listening/Subscribing to events

TODO

## Examples

### Get status of unigraph server
```json
{
    "type": "event",
    "event": "get_status",
    "id": 1608353103794
}
```

### List of all existing objects with ID
```json
{
    "type": "event",
    "event": "query_by_string_with_vars",
    "query": "query findByName() {entities(func: has(unigraph.id)) {uid expand(_predicate_) { uid expand(_predicate_)}}}",
    "vars": {},
    "id": 1608353103794
}
```

### Insert a new object
```json
{
    "type": "event",
    "event": "create_unigraph_object",
    "object": {
        "name": "Write initial definitions of JSON-TS",
        "done": false,
        "users": [
            {
                "name": "Haoji Xu",
            }
        ]
    },
    "schema": "$/schema/todo",
    "id": 1234567890
}
```

### Insert a new schema
```json
{
    "type": "event",
    "event": "create_unigraph_schema",
    "schema": {
        "unigraph.id": "$/schema/todo",
        "dgraph.type": "Type",
        "definition": {
            "type": {
                "$ref": {
                    "key": "unigraph.id",
                    "query": "$/composer/Object"
                }
            },
            "parameters": {
                "indexedBy": {
                    "$ref": {
                        "key": "unigraph.id",
                        "query": "$/primitive/string"
                    }
                },
                "indexes": [
                    "name"
                ]
            },
            "properties": [
                {
                    "key": "name",
                    "definition": {
                        "type": {
                            "$ref": {
                                "key": "unigraph.id",
                                "query": "$/primitive/string"
                            }
                        }
                    }
                },
                {
                    "key": "done",
                    "definition": {
                        "type": {
                            "$ref": {
                                "key": "unigraph.id",
                                "query": "$/primitive/boolean"
                            }
                        }
                    }
                },
                {
                    "key": "users",
                    "definition": {
                        "type": {
                            "$ref": {
                                "key": "unigraph.id",
                                "query": "$/composer/Array"
                            }
                        },
                        "parameters": {
                            "element": {
                                "type": {
                                    "$ref": {
                                        "key": "unigraph.id",
                                        "query": "$/schema/user"
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        }
    },
    "id": 1
}
```
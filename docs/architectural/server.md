---
updated_at: 2021-11-27T14:49:09-05:00
---
# Server API

We use a websocket-based API (with optional HTTP equivalence) for our server. To interact with the server, first establish a connection with the local server (default address is `ws://localhost:3000`). The equivalent HTTP API is available at `http://localhost:4001`

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

To send an event, use `"type": "event"` and `"event": "<name of the event to send>"` and add the appropriate event body.

To see a list of events, see the type declaration of the Unigraph interface in `packages/unigraph-dev-common`.


## Listening/Subscribing to events

You can use `subscribe_to_type` to subscribe to a given type of objects:
```json
{
    "type": "event",
    "event": "subscribe_to_type",
    "id": 1,
    "schema": "$/schema/todo"
}
```
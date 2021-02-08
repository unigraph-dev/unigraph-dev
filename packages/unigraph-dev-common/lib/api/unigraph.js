var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
export function makeUnigraphId(id) {
    return { 'unigraph.id': id };
}
export function makeRefUnigraphId(id) {
    return {
        "$ref": {
            "key": "unigraph.id",
            "query": id,
        }
    };
}
var typeMap = {
    "object": "_value",
    "number": "_value.#",
    "bigint": "_value.#i",
    "undefined": "_value",
    "null": "_value",
    "boolean": "_value.!",
    "string": "_value.%",
    "function": "_value",
    "symbol": "_value"
};
function unpadRecurse(object) {
    var result = undefined;
    if (typeof object === "object" && !Array.isArray(object)) {
        result = {};
        var predicate = Object.keys(object).find(function (p) { return p.startsWith("_value"); });
        if (predicate) { // In simple settings, if contains _value ignore all edge annotations
            result = unpadRecurse(object[predicate]);
        }
        else {
            result = Object.fromEntries(Object.entries(object).map(function (_a) {
                var k = _a[0], v = _a[1];
                return [k, unpadRecurse(v)];
            }));
        }
    }
    else if (Array.isArray(object)) {
        result = [];
        object.forEach(function (val) { return result.push(unpadRecurse(val)); });
    }
    else {
        result = object;
    }
    ;
    return result;
}
function unpad(object) {
    return __assign(__assign({}, unpadRecurse(object)), { uid: object.uid });
}
export default function unigraph(url) {
    var connection = new WebSocket(url);
    var messages = [];
    var eventTarget = new EventTarget();
    var callbacks = {};
    var subscriptions = {};
    function sendEvent(conn, name, params, id) {
        if (!id)
            id = Date.now();
        conn.send(JSON.stringify(__assign({ "type": "event", "event": name, "id": id }, params)));
    }
    connection.onmessage = function (ev) {
        try {
            var parsed = JSON.parse(ev.data);
            messages.push(parsed);
            eventTarget.dispatchEvent(new Event("onmessage", parsed));
            if (parsed.type === "response" && parsed.id && callbacks[parsed.id])
                callbacks[parsed.id](parsed);
            if (parsed.type === "subscription" && parsed.id && subscriptions[parsed.id])
                subscriptions[parsed.id](parsed.result);
        }
        catch (e) {
            console.error("Returned non-JSON reply!");
            console.log(ev.data);
        }
    };
    return {
        backendConnection: connection,
        backendMessages: messages,
        eventTarget: eventTarget,
        unpad: unpad,
        createSchema: function (schema) { return new Promise(function (resolve, reject) {
            var id = Date.now();
            callbacks[id] = function (response) {
                if (response.success)
                    resolve(response);
                else
                    reject(response);
            };
            sendEvent(connection, "create_unigraph_schema", { schema: schema }, id);
        }); },
        ensureSchema: function (name, fallback) { return new Promise(function (resolve, reject) {
            var id = Date.now();
            callbacks[id] = function (response) {
                if (response.success)
                    resolve(response);
                else
                    reject(response);
            };
            sendEvent(connection, "ensure_unigraph_schema", { name: name, fallback: fallback });
        }); },
        subscribeToType: function (name, callback, eventId) {
            if (eventId === void 0) { eventId = undefined; }
            return new Promise(function (resolve, reject) {
                var id = typeof eventId === "number" ? eventId : Date.now();
                callbacks[id] = function (response) {
                    if (response.success)
                        resolve(id);
                    else
                        reject(response);
                };
                subscriptions[id] = function (result) { return callback(result); };
                sendEvent(connection, "subscribe_to_type", { schema: name }, id);
            });
        },
        subscribeToObject: function (uid, callback, eventId) {
            if (eventId === void 0) { eventId = undefined; }
            return new Promise(function (resolve, reject) {
                var id = typeof eventId === "number" ? eventId : Date.now();
                callbacks[id] = function (response) {
                    if (response.success)
                        resolve(id);
                    else
                        reject(response);
                };
                subscriptions[id] = function (result) { return callback(result[0]); };
                var frag = "(func: uid(" + uid + ")) @recurse { uid expand(_predicate_) }";
                sendEvent(connection, "subscribe_to_object", { queryFragment: frag }, id);
            });
        },
        unsubscribe: function (id) {
            sendEvent(connection, "unsubscribe_by_id", {}, id);
        },
        addObject: function (object, schema) {
            sendEvent(connection, "create_unigraph_object", { object: object, schema: schema });
        },
        deleteObject: function (uid) {
            sendEvent(connection, "delete_unigraph_object", { uid: uid });
        },
        updateSimpleObject: function (object, predicate, value) {
            var predicateUid = object['_value'][predicate].uid;
            sendEvent(connection, "update_spo", { uid: predicateUid, predicate: typeMap[typeof value], value: value });
        },
        getReferenceables: function (key, asMapWithContent) {
            if (key === void 0) { key = "unigraph.id"; }
            if (asMapWithContent === void 0) { asMapWithContent = false; }
            return new Promise(function (resolve, reject) {
                var id = Date.now();
                callbacks[id] = function (response) {
                    if (response.success)
                        resolve(response.result.map(function (obj) { return obj["unigraph.id"]; }));
                    else
                        reject(response);
                };
                sendEvent(connection, "query_by_string_with_vars", {
                    vars: {},
                    query: "{\n                    q(func: has(unigraph.id)) {\n                        unigraph.id\n                    }\n                }"
                }, id);
            });
        }
    };
}

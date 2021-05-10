/**
 * This file defines all default information needed to set up Unigraph on Dgraph.
 * 
 * Default database entries includes default userland schemas (primitive, composers) and default dgraph schemas (and types).
 */

import {pkg as semantic} from 'unigraph-dev-common/lib/data/unigraph.semantic.pkg';
import {pkg as core} from 'unigraph-dev-common/lib/data/unigraph.core.pkg';
import {pkg as coreuser} from 'unigraph-dev-common/lib/data/unigraph.coreuser.pkg';
import {pkg as execexample} from 'unigraph-dev-common/lib/data/unigraph.execexample.pkg';

export const defaultTypes = `<_value>: uid .
<_value.#i>: int .
<_value.#>: float .
<_value.?>: bool .
<_value.%>: string .
<_value.>: default .
<_value[>: [uid] .
<_value.%dt>: dateTime @index(hour) .
<_definition>: uid .
<type>: uid .
<pkgManifest>: uid .
<unigraph.id>: string @index(exact) .
<_timestamp>: uid .
<_createdAt>: dateTime @index(hour) .
<_updatedAt>: dateTime @index(hour) .
type <Timestamp> {
    _createdAt
    _updatedAt
}
type <Entity> {
    type
    _timestamp
}
type <Type> {
	_definition
}
type <Package> {
    pkgManifest
}
`

export const packageManifestSchema = {
    "unigraph.id": "$/schema/package_manifest",
    "dgraph.type": "Type",
    "_definition": {
        "type": {
            "unigraph.id": "$/composer/Object"
        },
        "_parameters": {
            "_indexedBy": {
                "unigraph.id": "$/primitive/string"
            },
            "_indexes": [ ]
        },
        "_properties": [
            {
                "_key": "name",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "_key": "package_name",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                },
                "_unique": true
            },
            {
                "_key": "version",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "_key": "description",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            }
        ]
    }
}

export const packageExecutableSchema = {
    "unigraph.id": "$/schema/executable",
    "dgraph.type": "Type",
    "_definition": {
        "type": {
            "unigraph.id": "$/composer/Object"
        },
        "_parameters": {
            "_indexedBy": {
                "unigraph.id": "$/primitive/string"
            },
            "_indexes": [ ]
        },
        "_properties": [
            {
                "_key": "name",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "_key": "env",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "_key": "periodic",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "_key": "src",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "_key": "editable",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/boolean"
                    }
                }
            },
            {
                "_key": "edited",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "_key": "semantic_properties",
                "_definition": {
                    "type": {"unigraph.id": "$/schema/semantic_properties"},
                }
            }
        ]
    }
}


export const defaultUserlandSchemas = [
    {
        "unigraph.id": "$/primitive/number"
    },
    {
        "unigraph.id": "$/primitive/boolean"
    },
    {
        "unigraph.id": "$/primitive/string"
    },
    {
        "unigraph.id": "$/primitive/null"
    },
    {
        "unigraph.id": "$/primitive/undefined"
    },
    {
        "unigraph.id": "$/composer/List" // Unordered list
    },
    {
        "unigraph.id": "$/composer/Array" // Ordered array
    },
    {
        "unigraph.id": "$/composer/Object"
    },
    {
        "unigraph.id": "$/composer/Interface"
    },
    {
        "unigraph.id": "$/schema/any",
        "dgraph.type": [ "Type" ]
    },
    {
        "unigraph.id": "$/unigraph",
        "_version": "schema-v0.0.1dev"
    },
    {
        "unigraph.id": "$/meta/namespace_map",
    },
    packageManifestSchema,
    packageExecutableSchema
]

export const defaultPackages = [
    semantic, core, execexample, coreuser
]
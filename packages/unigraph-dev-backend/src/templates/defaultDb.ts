/**
 * This file defines all default information needed to set up Unigraph on Dgraph.
 * 
 * Default database entries includes default userland schemas (primitive, composers) and default dgraph schemas (and types).
 */

import {pkg as semantic} from 'unigraph-dev-common/lib/data/unigraph.semantic.pkg'

export const defaultTypes = `<_value>: uid .
<_value.#i>: int .
<_value.#>: float .
<_value.?>: bool .
<_value.%>: string .
<_value.>: default .
<_value[>: [uid] .
<definition>: uid .
<type>: uid .
<pkgManifest>: uid .
<unigraph.id>: string @index(exact) .
type <Entity> {
	type
}
type <Type> {
	definition
}
type <Package> {
    pkgManifest
}
`

export const packageManifestSchema = {
    "unigraph.id": "$/schema/package_manifest",
    "dgraph.type": "Type",
    "definition": {
        "type": {
            "unigraph.id": "$/composer/Object"
        },
        "parameters": {
            "indexedBy": {
                "unigraph.id": "$/primitive/string"
            },
            "indexes": [ ]
        },
        "properties": [
            {
                "key": "name",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "key": "package_name",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                },
                "unique": true
            },
            {
                "key": "version",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "key": "description",
                "definition": {
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
    "definition": {
        "type": {
            "unigraph.id": "$/composer/Object"
        },
        "parameters": {
            "indexedBy": {
                "unigraph.id": "$/primitive/string"
            },
            "indexes": [ ]
        },
        "properties": [
            {
                "key": "name",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "key": "env",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "key": "src",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "key": "editable",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/boolean"
                    }
                }
            },
            {
                "key": "edited",
                "definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
            },
            {
                "key": "semantic_properties",
                "definition": {
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
        "unigraph.id": "$/composer/Array"
    },
    {
        "unigraph.id": "$/composer/Object"
    },
    {
        "unigraph.id": "$/composer/Interface"
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
    semantic
]
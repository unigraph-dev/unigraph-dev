/**
 * This file defines all default information needed to set up Unigraph on Dgraph.
 * 
 * Default database entries includes default userland schemas (primitive, composers) and default dgraph schemas (and types).
 */

import {pkg as semantic} from 'unigraph-dev-common/lib/data/unigraph.semantic.pkg';
import {pkg as core} from 'unigraph-dev-common/lib/data/unigraph.core.pkg';
import {pkg as coreuser} from 'unigraph-dev-common/lib/data/unigraph.coreuser.pkg';
import {pkg as execexample} from 'unigraph-dev-common/lib/data/unigraph.execexample.pkg';
import {pkg as calendar} from 'unigraph-dev-common/lib/data/unigraph.calendar.pkg';
import {pkg as notes} from 'unigraph-dev-common/lib/data/unigraph.notes.pkg';
import {pkg as home} from 'unigraph-dev-common/lib/data/unigraph.home.pkg';

// Userspace packages
import {pkg as onboarding} from 'unigraph-dev-common/lib/data/unigraph.onboarding.pkg';
import {pkg as todo} from 'unigraph-dev-common/lib/data/unigraph.todo.pkg';
import {pkg as bookmark} from 'unigraph-dev-common/lib/data/unigraph.bookmark.pkg';
import {pkg as rss_reader} from 'unigraph-dev-common/lib/data/unigraph.rss_reader.pkg';
import {pkg as email} from 'unigraph-dev-common/lib/data/unigraph.email.pkg';
import {pkg as reddit} from 'unigraph-dev-common/lib/data/unigraph.reddit.pkg';
import {pkg as twitter} from 'unigraph-dev-common/lib/data/unigraph.twitter.pkg';
import {pkg as nlp} from 'unigraph-dev-common/lib/data/unigraph.nlp.pkg';
import {pkg as openai} from 'unigraph-dev-common/lib/data/unigraph.openai.pkg';

export const defaultTypes = `<_value>: uid .
<_value.#i>: int .
<_value.#>: float .
<_value.?>: bool .
<_value.%>: string @index(fulltext) .
<_value.>: default .
<_value[>: [uid] .
<_value.%dt>: dateTime @index(hour) .
<_definition>: uid .
<type>: uid @reverse .
<pkgManifest>: uid .
<unigraph.id>: string @index(exact) .
<unigraph.origin>: [uid] @reverse .
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
            }
        },
        "_properties": [
            {
                "_key": "name",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                },
                "_indexAs": "name"
            },
            {
                "_key": "package_name",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                }
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
            }
        },
        "_properties": [
            {
                "_key": "name",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/primitive/string"
                    }
                },
                "_indexAs": "name"
            },
            {
                "_key": "imports",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/composer/Array"
                    },
                    "_parameters": {
                        "_element": {
                            "type": { "unigraph.id": "$/composer/Object" },
                            "_parameters": {
                                "_indexedBy": {
                                    "unigraph.id": "$/primitive/string"
                                }
                            },
                            "_properties": [
                                {
                                    "_key": "env",
                                    "_definition": {
                                        "type": {
                                            "unigraph.id": "$/primitive/string"
                                        }
                                    }
                                },
                                {
                                    "_key": "package",
                                    "_definition": {
                                        "type": {
                                            "unigraph.id": "$/primitive/string"
                                        }
                                    }
                                },
                                {
                                    "_key": "import",
                                    "_definition": {
                                        "type": { "unigraph.id": "$/composer/Union" },
                                        "_parameters": {
                                            "_definitions": [{
                                                "type": { "unigraph.id": "$/schema/executable" }
                                            }, {
                                                "type": { "unigraph.id": "$/primitive/string" }
                                            }]
                                        }
                                    }
                                },
                                {
                                    "_key": "as",
                                    "_definition": {
                                        "type": {
                                            "unigraph.id": "$/primitive/string"
                                        }
                                    }
                                },
                            ]
                        }
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
                "_key": "on_hook",
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
                "_key": "children",
                "_definition": {
                    "type": {
                        "unigraph.id": "$/composer/Array"
                    },
                    "_parameters": {
                        "_element": {
                            "type": { "unigraph.id": "$/composer/Union" },
                            "_parameters": {
                                "_definitions": [{
                                    "type": { "unigraph.id": "$/schema/subentity" }
                                }, {
                                    "type": { "unigraph.id": "$/schema/interface/semantic" }
                                }]
                            }
                        }
                    }
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
        "unigraph.id": "$/composer/Union"
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
    semantic, core, execexample, coreuser, home, calendar, notes,
    onboarding, todo, bookmark, rss_reader, email, reddit, twitter, nlp, openai
]
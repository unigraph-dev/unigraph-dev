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
import {pkg as kanban} from 'unigraph-dev-common/lib/data/unigraph.kanban.pkg';

export const defaultTypes = `<_value>: uid @reverse .
<_value.#i>: int .
<_value.#>: float .
<_value.?>: bool .
<_value.%>: string @index(fulltext, trigram) .
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
    "_name": "Package manifest",
    "_icon": "%3Csvg xmlns='http://www.w3.org/2000/svg' style='width:24px;height:24px' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L10.11,5.22L16,8.61L17.96,7.5L12,4.15M6.04,7.5L12,10.85L13.96,9.75L8.08,6.35L6.04,7.5M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z' /%3E%3C/svg%3E",
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
    "_name": "Executable",
    "_icon": "%3Csvg xmlns='http://www.w3.org/2000/svg' style='width:24px;height:24px' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19.59,12L16,8.41V5.58L22.42,12L16,18.41V15.58L19.59,12M1.58,12L8,5.58V8.41L4.41,12L8,15.58V18.41L1.58,12Z' /%3E%3C/svg%3E",
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
    packageManifestSchema,
    packageExecutableSchema,
    {
        "unigraph.id": "$/meta/namespace_map",
        "$/schema/executable": { "unigraph.id": "$/schema/executable" },
        "$/schema/package_manifest": { "unigraph.id": "$/schema/package_manifest" }
    },
]

export const defaultPackages = [
    semantic, core, execexample, coreuser, home, calendar, notes,
    onboarding, todo, bookmark, rss_reader, email, reddit, twitter, nlp, openai, kanban
]
import { PackageDeclaration } from "../types/packages";
import { makeUnigraphId, makeRefUnigraphId } from "../utils/entityUtils"

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "Semantic",
        package_name: "unigraph.semantic",
        version: "0.0.1",
        description: "Semantic properties support for unigraph objects."
    },
    pkgSchemas: {
        color: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        person: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        tag: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/composer/Object'),
                "_parameters": {
                    "_indexedBy": makeUnigraphId("$/primitive/string"),
                    "_indexes": ["name"]
                },
                "_properties": [
                    {
                        "_key": "name",
                        "_definition": {
                            "type": makeUnigraphId("$/primitive/string")
                        },
                        "_unique": true
                    },
                    {
                        "_key": "color",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/color")
                        }
                    },
                    {
                        "_key": "semantic_properties",
                        "_definition": {
                            "type": makeUnigraphId("$/schema/semantic_properties")
                        }
                    },
                ]
            }
        },
        note: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        "interface/textual": {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/composer/Union'),
                "_parameters": {
                    "_definitions": [{
                        "type": makeUnigraphId('$/schema/note')
                    }]
                }
            }
        },
        "interface/semantic": {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/composer/Union'),
                "_parameters": {
                    "_definitions": []
                }
            }
        },
        semantic_properties: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/composer/Object'),
                "_parameters": {
                    "_indexedBy": makeUnigraphId("$/primitive/string"),
                    "_indexes": ["name"]
                },
                "_properties": [
                    {
                        "_key": "children",
                        "_definition": {
                            "type": makeUnigraphId('$/composer/Array'),
                            "_parameters": {
                                "_element": {
                                    "type": makeUnigraphId('$/composer/Union'),
                                    "_parameters": {
                                        "_definitions": [{
                                            "type": makeUnigraphId('$/schema/interface/textual')
                                        }, {
                                            "type": makeUnigraphId('$/schema/interface/semantic')
                                        }, {
                                            "type": makeUnigraphId('$/schema/tag')
                                        }]
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        },
        creative_work: {
            "dgraph.type": "Type",
            "_definition": {
                "type": makeUnigraphId('$/composer/Object'),
                "_parameters": {
                    "_indexedBy": makeUnigraphId("$/primitive/string"),
                    "_indexes": ["name"]
                },
                "_properties": [
                    {
                        "_key": "text",
                        "_definition": {
                            "type": makeUnigraphId('$/schema/interface/textual')
                        }
                    },
                    {
                        "_key": "abstract",
                        "_definition": {
                            "type": makeUnigraphId('$/schema/interface/textual')
                        }
                    },
                    {
                        "_key": "author",
                        "_definition": {
                            "type": makeUnigraphId('$/schema/person')
                        }
                    }
                ]
            }
        }
    }
}
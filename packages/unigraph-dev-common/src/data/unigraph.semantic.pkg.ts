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
            "definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        tag: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/composer/Object'),
                "parameters": {
                    "indexedBy": makeUnigraphId("$/primitive/string"),
                    "indexes": ["name"]
                },
                "properties": [
                    {
                        "key": "name",
                        "definition": {
                            "type": makeUnigraphId("$/primitive/string")
                        },
                        "unique": true
                    },
                    {
                        "key": "color",
                        "definition": {
                            "type": makeUnigraphId("$/schema/color")
                        }
                    },
                    {
                        "key": "semantic_properties",
                        "definition": {
                            "type": makeUnigraphId("$/schema/semantic_properties")
                        }
                    },
                ]
            }
        },
        note: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/primitive/string')
            }
        },
        "interface/note": {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/composer/Union'),
                "parameters": {
                    "definitions": [{
                        "type": makeUnigraphId('$/schema/note')
                    }]
                }
            }
        },
        "interface/semantic": {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/composer/Union'),
                "parameters": {
                    "definitions": []
                }
            }
        },
        semantic_properties: {
            "dgraph.type": "Type",
            "definition": {
                "type": makeUnigraphId('$/composer/Object'),
                "parameters": {
                    "indexedBy": makeUnigraphId("$/primitive/string"),
                    "indexes": ["name"]
                },
                "properties": [
                    {
                        "key": "children",
                        "definition": {
                            "type": makeUnigraphId('$/composer/Array'),
                            "parameters": {
                                "element": {
                                    "type": makeUnigraphId('$/composer/Union'),
                                    "parameters": {
                                        "definitions": [{
                                            "type": makeUnigraphId('$/schema/interface/note')
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
        }
    }
}
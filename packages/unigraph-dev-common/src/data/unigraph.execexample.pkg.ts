import { PackageDeclaration } from "../types/packages";

export const pkg: PackageDeclaration = {
    pkgManifest: {
        name: "Executables",
        package_name: "unigraph.execexample",
        version: "0.0.1",
        description: "Example executables"
    },
    pkgSchemas: {},
    pkgExecutables: {
        "hello": {
            env: "routine/js",
            src: "console.log('Hello world!')",
            editable: true,
            name: "Hello World"
        },
        "time-announcer": {
            env: "routine/js",
            src: "console.log(new Date())",
            periodic: "* * * * *",
            editable: true,
            name: "Announce the current time"
        }
    }
}
#!/usr/bin/env node
// Minimal implementation of Unigraph packager - this is subject to change
// This is supposed to be run in a Node environment.
if (!(typeof process !== 'undefined' && process.release.name === 'node')) {
    throw new Error("We're not running in node, exiting...");
}

const yargs = require('yargs/yargs');
const path = require('path');
const fs = require('fs');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv));

const packageDirRoot = path.resolve(argv._[0]);
const outDir = path.resolve(argv.o);

let packageJson;

try {
    packageJson = JSON.parse(
        fs.readFileSync(path.join(packageDirRoot, 'package.json')),
    );
} catch (e) {
    throw new Error(
        "package.json malformatted or doesn't exist - check your input commands!",
    );
}

function getFileContent(relative) {
    const data = fs.readFileSync(path.join(packageDirRoot, relative));
    return data.toString();
}

// End of environment setup

const headerContent = `// Unigraph package declaration
// This file is auto-generated by Unigraph packager.
`;

const schemasDecl = Array.isArray(packageJson.unigraph.schemas)
    ? packageJson.unigraph.schemas
    : [];
const executablesDecl = Array.isArray(packageJson.unigraph.executables)
    ? packageJson.unigraph.executables
    : [];
const entitiesDecl = Array.isArray(packageJson.unigraph.entities)
    ? packageJson.unigraph.entities
    : [];

// TODO: add custom views
const declObject = {
    pkgManifest: {
        name: packageJson.displayName,
        package_name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
    },
    pkgSchemas: Object.fromEntries(
        schemasDecl.map((el) => [el.id, JSON.parse(getFileContent(el.src))]),
    ),
    pkgExecutables: Object.fromEntries(
        executablesDecl.map((el) => [
            el.id,
            {
                ...el,
                id: undefined,
                src: getFileContent(el.src),
            },
        ]),
    ),
    pkgEntities: Object.fromEntries(
        entitiesDecl.map((el) => [el.id, JSON.parse(getFileContent(el.src))]),
    ),
};

const finalPackage = `${headerContent}\nconst pkg = ${JSON.stringify(
    declObject,
    null,
    2,
)}\n\nexports.pkg = pkg;`;

// console.log(finalPackage)
fs.writeFileSync(path.join(outDir, `${packageJson.name}.pkg.js`), finalPackage);

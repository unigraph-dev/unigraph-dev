#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv));
const fs = require('fs');

const { packageName, commandNameSnakeCase, remove } = argv;

if (!packageName) {
    console.error('No package name!');
} else if (!commandNameSnakeCase) {
    console.error('No command name!');
}

const defaultPackagesPath = `${__dirname}/../packages/default-packages`;

// check if "unigraph.${packageName}" exists in "../packages/default-packages/"
const packagePath = `${defaultPackagesPath}/unigraph.${packageName}`;
if (!fs.existsSync(packagePath)) {
    console.error(`${packagePath} does not exist!`);
}

const snakeToKebabCase = (str) => str.replace('_', '-');
const snakeToCamelCase = (str) =>
    str
        .split('_')
        .map((word, idx) => (idx > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join('');
const snakeToSentence = (str) =>
    str
        .split('_')
        .map((word, idx) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

const createCommandFile = (snakeCaseCommandName) => {
    // Create ${pakagePath}/entities/${snakeCaseCommandName}_command.json
    const commandPath = `${packagePath}/entities/${snakeCaseCommandName}_command.json`;
    const commandNameSpaceSeparated = snakeToSentence(snakeCaseCommandName);

    if (fs.existsSync(commandPath)) {
        console.error(`${commandPath} already exists!`);
    } else {
        // create entities dir if it does not exist
        const entitiesDir = `${packagePath}/entities`;
        if (!fs.existsSync(entitiesDir)) {
            fs.mkdirSync(entitiesDir);
        }
        fs.writeFileSync(
            commandPath,
            JSON.stringify(
                {
                    type: { 'unigraph.id': '$/schema/command' },
                    name: `${commandNameSpaceSeparated} (Command)`,
                },
                null,
                2,
            ),
        );
        console.log(`${commandPath} created!`);
    }
};

const deleteCommandFile = (snakeCaseCommandName) => {
    // Delete ${pakagePath}/entities/${snakeCaseCommandName}_command.json
    const commandPath = `${packagePath}/entities/${snakeCaseCommandName}_command.json`;
    if (fs.existsSync(commandPath)) {
        fs.unlinkSync(commandPath);
    }
    console.log(`${commandPath} deleted!`);
};

const updatePackageJsonWithEntity = (snakeCaseCommandName) => {
    // add {id, src} to  packageJson.unigraph.entities
    const packageJsonPath = `${packagePath}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const entities = packageJson.unigraph.entities || [];
    const newEntity = {
        id: `${snakeCaseCommandName}_command`,
        src: `entities/${snakeCaseCommandName}_command.json`,
    };
    entities.push(newEntity);
    packageJson.unigraph.entities = entities;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${packageJsonPath} updated!`);
};

const removeEntityFromPackageJson = (snakeCaseCommandName) => {
    // remove {id, src} from  packageJson.unigraph.entities
    const packageJsonPath = `${packagePath}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const entities = packageJson.unigraph.entities || [];
    const newEntities = entities.filter((entity) => entity.id !== `${snakeCaseCommandName}_command`);
    packageJson.unigraph.entities = newEntities;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${packageJsonPath} updated!`);
};

// RUNNING

if (!remove) {
    createCommandFile(commandNameSnakeCase);
    updatePackageJsonWithEntity(commandNameSnakeCase);
} else {
    deleteCommandFile(commandNameSnakeCase);
    removeEntityFromPackageJson(commandNameSnakeCase);
}

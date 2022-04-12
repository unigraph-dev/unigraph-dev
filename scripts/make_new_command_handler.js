#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv));
const fs = require('fs');

const { packageName, commandNameSnakeCase, handlerNameSnakeCase, remove } = argv;

if (!packageName) {
    console.error('No package name!');
} else if (!handlerNameSnakeCase) {
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

// create command handler entity

const createCommandHandlerFile = (snakeCaseCommandName, snakeCaseHandlerName) => {
    // Create ${pakagePath}/entities/${snakeCaseHandlerName}_command_handler.json
    const commandHandlerPath = `${packagePath}/entities/${snakeCaseHandlerName}_command_handler.json`;
    if (fs.existsSync(commandHandlerPath)) {
        console.error(`${commandHandlerPath} already exists!`);
    } else {
        // create entities dir if it does not exist
        const entitiesDir = `${packagePath}/entities`;
        if (!fs.existsSync(entitiesDir)) {
            fs.mkdirSync(entitiesDir);
        }
        fs.writeFileSync(
            commandHandlerPath,
            JSON.stringify(
                {
                    type: { 'unigraph.id': '$/schema/command_handler' },
                    command: { 'unigraph.id': `./entity/${snakeCaseCommandName}_command` },
                    action: { 'unigraph.id': `./executable/${snakeToKebabCase(snakeCaseHandlerName)}-action` },
                    condition: { 'unigraph.id': `./executable/${snakeToKebabCase(snakeCaseHandlerName)}-condition` },
                },
                null,
                2,
            ),
        );
        console.log(`Created '${snakeCaseHandlerName}' as a handler for '${snakeCaseCommandName}'`);
    }
};

const deleteCommandHandlerFile = (snakeCaseCommandName) => {
    // Delete ${pakagePath}/entities/${snakeCaseCommandName}_command_handler.json
    const commandHandlerPath = `${packagePath}/entities/${snakeCaseCommandName}_command_handler.json`;
    if (fs.existsSync(commandHandlerPath)) {
        fs.unlinkSync(commandHandlerPath);
        console.log(`Deleted '${snakeCaseCommandName}'`);
    }
};

const updatePackageJsonWithEntity = (snakeCaseHandlerName) => {
    // add {id, src} to  packageJson.unigraph.entities
    const packageJsonPath = `${packagePath}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const entities = packageJson.unigraph.entities || [];
    const newEntity = {
        id: `${snakeCaseHandlerName}_command_handler`,
        src: `entities/${snakeCaseHandlerName}_command_handler.json`,
    };
    entities.push(newEntity);
    packageJson.unigraph.entities = entities;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated package.json with a new entity: ${snakeCaseHandlerName}`);
};

const removeEntityFromPackageJson = (snakeCaseHandlerName) => {
    // remove {id, src} from  packageJson.unigraph.entities
    const packageJsonPath = `${packagePath}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const entities = packageJson.unigraph.entities || [];
    const newEntities = entities.filter((entity) => entity.id !== `${snakeCaseHandlerName}_command_handler`);
    packageJson.unigraph.entities = newEntities;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated package.json to remove entity: ${snakeCaseHandlerName}`);
};

// make empty handlerNameAction and handlerNameCondition .js files in camel-case
const createHandlerExecutables = (snakeCaseHandlerName) => {
    const handlerName = snakeToCamelCase(snakeCaseHandlerName);
    const handlerNameAction = `${handlerName}Action`;
    const handlerNameCondition = `${handlerName}Condition`;
    const handlerNameActionPath = `${packagePath}/executables/${handlerNameAction}.js`;
    const handlerNameConditionPath = `${packagePath}/executables/${handlerNameCondition}.js`;
    if (fs.existsSync(handlerNameActionPath)) {
        console.error(`${handlerNameActionPath} already exists!`);
    } else {
        fs.writeFileSync(handlerNameActionPath, '');
    }
    if (fs.existsSync(handlerNameConditionPath)) {
        console.error(`${handlerNameConditionPath} already exists!`);
    } else {
        // create executables dir if it does not exist
        const executablesDir = `${packagePath}/executables`;
        if (!fs.existsSync(executablesDir)) {
            fs.mkdirSync(executablesDir);
        }
        fs.writeFileSync(handlerNameActionPath, '');
        fs.writeFileSync(handlerNameConditionPath, 'true');
        console.log(`Created ${handlerNameAction} and ${handlerNameCondition}`);
    }
};

const deleteHandlerExecutables = (snakeCaseHandlerName) => {
    const handlerName = snakeToCamelCase(snakeCaseHandlerName);
    const handlerNameAction = `${handlerName}Action`;
    const handlerNameCondition = `${handlerName}Condition`;
    const handlerNameActionPath = `${packagePath}/executables/${handlerNameAction}.js`;
    const handlerNameConditionPath = `${packagePath}/executables/${handlerNameCondition}.js`;
    if (fs.existsSync(handlerNameActionPath)) {
        fs.unlinkSync(handlerNameActionPath);
    }
    if (fs.existsSync(handlerNameConditionPath)) {
        fs.unlinkSync(handlerNameConditionPath);
        console.log(`Deleted ${handlerNameAction} and ${handlerNameCondition}`);
    }
};

const updatePackageJsonWithExecutables = (snakeCaseHandlerName) => {
    // update package.json with executables
    const packageJsonPath = `${packagePath}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const executables = packageJson.unigraph.executables || [];
    packageJson.unigraph.executables = [
        ...executables,
        {
            id: `${snakeToKebabCase(snakeCaseHandlerName)}-action`,
            env: 'client/js',
            src: `executables/${snakeToKebabCase(snakeCaseHandlerName)}Action.js`,
            editable: true,
            name: `${snakeToSentence(snakeCaseHandlerName)} (Action)`,
            concurrency: 1,
        },
        {
            id: `${snakeToKebabCase(snakeCaseHandlerName)}-condition`,
            env: 'lambda/js',
            src: `executables/${snakeToKebabCase(snakeCaseHandlerName)}Condition.js`,
            editable: true,
            name: `${snakeToSentence(snakeCaseHandlerName)} (Condition)`,
            concurrency: 1,
        },
    ];
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated package.json with executables`);
};

const removeExecutablesFromPackageJson = (snakeCaseHandlerName) => {
    // remove executables from package.json
    const packageJsonPath = `${packagePath}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const executables = packageJson.unigraph.executables || [];
    const newExecutables = executables.filter(
        (executable) =>
            executable.id !== `${snakeToKebabCase(snakeCaseHandlerName)}-action` &&
            executable.id !== `${snakeToKebabCase(snakeCaseHandlerName)}-condition`,
    );
    packageJson.unigraph.executables = newExecutables;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated package.json to remove executables`);
};

if (!remove) {
    // create command handler entity
    createCommandHandlerFile(commandNameSnakeCase, handlerNameSnakeCase);
    // update package.json with command handler entity
    updatePackageJsonWithEntity(handlerNameSnakeCase);
    // make empty handlerNameAction and handlerNameCondition .js files in camel-case
    createHandlerExecutables(handlerNameSnakeCase);
    // update package.json with executables
    updatePackageJsonWithExecutables(handlerNameSnakeCase);
} else {
    // delete command handler entity
    deleteCommandHandlerFile(handlerNameSnakeCase);
    // remove entity from package.json
    removeEntityFromPackageJson(handlerNameSnakeCase);
    // delete handlerNameAction and handlerNameCondition .js files in camel-case
    deleteHandlerExecutables(handlerNameSnakeCase);
    // remove executables from package.json
    removeExecutablesFromPackageJson(handlerNameSnakeCase);
}

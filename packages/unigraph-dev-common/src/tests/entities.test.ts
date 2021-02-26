/**
 * Test file for entity-related functions and data models.
 * For the tests used, check out testEntities.json.
 */
const { buildUnigraphEntity, processAutoref } = require('../utils/entityUtils');
const testEntities = require('./testEntities.json')

const schemas = {
    "$/schema/todo": testEntities['todo-schema-test'],
    "$/schema/user": testEntities['user-schema-test'],
}

test('should build unigraph entity based on schema and input', () => {
    expect(buildUnigraphEntity(testEntities['todo-entity-test'], "$/schema/todo", schemas))
        .toEqual(testEntities['todo-entity-test-target-noref'])
});

describe('should convert references to `$ref` syntax using Autoref', () => {
    test('should automatically resolve references to `unigraph.id`', () => {
        expect(processAutoref(testEntities['simpletodo-entity-test-target-noref'], '$/schema/todo', schemas))
            .toEqual(testEntities['simpletodo-entity-test-target-ref'])
    });

    test('should automatically add unique constraints by schema', () => {
        expect(processAutoref(testEntities['todo-entity-test-target-noref'], '$/schema/todo', schemas))
            .toEqual(testEntities['todo-entity-test-target-ref'])
    });
});

/**
 * Test file for entity-related functions and data models.
 * For the tests used, check out testEntities.json.
 */
const { buildUnigraphEntity, processAutoref, makeQueryFragmentFromType } = require('../utils/entityUtils');
const testEntities_1 = require('./testEntities_1.json')
const testEntities_2 = require('./testEntities_2.json')

const schemas = {
    "$/schema/todo": testEntities_1['todo-schema-test'],
    "$/schema/user": testEntities_1['user-schema-test'],
}

test('should build unigraph entity based on schema and input', () => {
    expect(buildUnigraphEntity(testEntities_1['todo-entity-test'], "$/schema/todo", schemas))
        .toEqual(testEntities_1['todo-entity-test-target-noref'])
});

describe('should convert references to `$ref` syntax using Autoref', () => {
    test('should automatically resolve references to `unigraph.id`', () => {
        expect(processAutoref(testEntities_1['simpletodo-entity-test-target-noref'], '$/schema/todo', schemas))
            .toEqual(testEntities_1['simpletodo-entity-test-target-ref'])
    });

    test('should automatically add unique constraints by schema', () => {
        expect(processAutoref(testEntities_1['todo-entity-test-target-noref'], '$/schema/todo', schemas))
            .toEqual(testEntities_1['todo-entity-test-target-ref'])
    });
});


describe('should build database query strings based on schema', () => {
    test('should build database query for simple objects', () => {
        expect(makeQueryFragmentFromType("$/schema/todo", schemas) === testEntities_2['expected']['simple'])
    })
    test('should build database query for complex objects', () => {
        expect(makeQueryFragmentFromType("$/schema/todo", testEntities_2['test-2-schemas']) === testEntities_2['expected']['complex'])
    })
})
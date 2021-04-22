/**
 * Test file for entity-related functions and data models.
 * For the tests used, check out testEntities.json.
 */
const { buildUnigraphEntity, processAutoref, makeQueryFragmentFromType } = require('../utils/entityUtils');
const testEntities_1 = require('./testEntities_1.json')
const testEntities_2 = require('./testEntities_2.json')
const testEntities_3 = require('./testEntities_3_union.json')

const schemas = {
    "$/schema/todo": testEntities_1['todo-schema-test'],
    "$/schema/user": testEntities_1['user-schema-test'],
}

test('should build unigraph entity based on schema and input', () => {
    expect(buildUnigraphEntity(testEntities_1['todo-entity-test'], "$/schema/todo", schemas))
        .toEqual(testEntities_1['todo-entity-test-target-noref'])
});

describe('should build unigraph entity using union types', () => {
    test('should build unigraph entity with union type', () => {
        expect(buildUnigraphEntity(testEntities_3['todo-entity-test'], "$/schema/todo", {
            "$/schema/todo": testEntities_3['todo-schema-test'],
            "$/schema/user": testEntities_3['user-schema-test'],
        }))
        .toEqual(testEntities_3['todo-entity-test-target-noref'])
    });

    test('should reject union types with ambiguous selections', () => {
        expect(() => buildUnigraphEntity(testEntities_3['todo-entity-test'], "$/schema/todo", {
            "$/schema/todo": testEntities_3['todo-schema-test_2'],
            "$/schema/user": testEntities_3['user-schema-test'],
        }))
        .toThrowError("Union type does not allow ambiguous or nonexistent selections!")
    })
})

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
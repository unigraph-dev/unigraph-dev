/**
 * Test file for entity-related functions and data models.
 * For the tests used, check out testEntities.json.
 */
const { buildUnigraphEntity, processAutoref, processAutorefUnigraphId, makeQueryFragmentFromType, unpad } = require('../utils/entityUtils');
const testEntities_1 = require('./testEntities_1.json')
const testEntities_2 = require('./testEntities_2.json')
const testEntities_3 = require('./testEntities_3_union.json')
const testEntities_4 = require('./testEntities_4_type_alias.json')
const testEntities_5 = require('./testEntities_5_any.json')
const testEntities_6 = require('./testEntities_6_unpad.json')
const testEntities_7 = require('./testEntities_7_partial.json')

jest
  .useFakeTimers('modern')
  .setSystemTime(new Date(0).getTime());


const schemas = {
    "$/schema/todo": testEntities_1['todo-schema-test'],
    "$/schema/user": testEntities_1['user-schema-test'],
}

const schemas2 = testEntities_2['test-2-schemas']

describe('should build unigraph entity based on schema and input', () => {
    test('should build simple unigraph entity based on schema and input', () => {
        expect(buildUnigraphEntity(testEntities_1['todo-entity-test'], "$/schema/todo", schemas))
            .toEqual(testEntities_1['todo-entity-test-target-noref'])
    });

    test('should build unigraph entity based on schema and input with type aliases', () => {
        expect(buildUnigraphEntity(testEntities_4['typealias-todo-object'], "$/schema/todo", schemas2))
            .toEqual(testEntities_4['typealias-todo-expected'])
    });
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
            "$/schema/user_2": testEntities_3['user-schema-test'],
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
/*
/// Removed due to recursion depth variance in production
describe('should build database query strings based on schema', () => {
    test('should build database query for simple objects', () => {
        expect(makeQueryFragmentFromType("$/schema/todo", schemas, 6, false)).toEqual(testEntities_2['expected']['simple'])
    })
    test('should build database query for complex objects', () => {
        expect(makeQueryFragmentFromType("$/schema/todo", testEntities_2['test-2-schemas'], 6, false)).toEqual(testEntities_2['expected']['complex'])
    })

    test('should build database query for $/schema/any', () => {
        expect(makeQueryFragmentFromType("$/schema/list", testEntities_2['test-2-schemas'], 6, false)).toEqual(testEntities_2['expected']['withany'])
    })
})*/

describe('should process objects with schema that includes $/schema/any', () => {
    let schemasAny = JSON.parse(JSON.stringify(schemas2));
    schemasAny['$/schema/semantic_properties'] = testEntities_5['$/schema/semantic_properties'];
    test('should allow object with defined schema type in `any` argument', () => {
        expect(buildUnigraphEntity(testEntities_5['typealias-todo-object-any'], "$/schema/todo", schemasAny))
            .toEqual(testEntities_4['typealias-todo-expected'])
    });
    test('should disallow object without defined schema type in `any` argument', () => {
        expect(() => buildUnigraphEntity(testEntities_5['typealias-todo-object-disallow'], "$/schema/todo", schemasAny))
            .toThrowError("`$/schema/any` directive must have a corresponding type declaration in object!")
    });
})

describe('should process autoref for schemas and partial objects as well', () => {
    test('should convert schema objects into autoref mentions', () => {
        expect(processAutorefUnigraphId(testEntities_1['user-schema-test'])).toEqual(testEntities_1['user-schema-test-autoref'])
    })

    test('should work with partial objects without autoref', () => {
        expect(processAutorefUnigraphId(testEntities_7['partial-object-no-autoref'])).toEqual(testEntities_7['partial-object-no-autoref'])
    })

    test('should work with partial objects with autoref too', () => {
        expect(processAutorefUnigraphId(testEntities_7['partial-object-autoref'])).toEqual(testEntities_7['partial-object-autoref-withref'])
    })
})

describe('should unpad Unigraph entities', () => {
    test('should preserve orders for ordered lists', () => {
        expect(unpad(testEntities_6['before-unpad-ordered'])).toEqual(testEntities_6['after-unpad-ordered'])
    }),
    test('should preserve timestamps', () => {
        expect(unpad(testEntities_6['before-unpad-timestamp'])).toEqual(testEntities_6['after-unpad-timestamp'])
    })
})

describe('should pass through direct UID references', () => {
    let schemasAny = JSON.parse(JSON.stringify(schemas2));
    schemasAny['$/schema/semantic_properties'] = testEntities_5['$/schema/semantic_properties'];
    test('should yield pure UID references without changing anything', () => {
        expect(buildUnigraphEntity(testEntities_5['typealias-todo-object-uidref'], "$/schema/todo", schemasAny))
            .toEqual(testEntities_4['typealias-todo-expected-uidref'])
    })
})
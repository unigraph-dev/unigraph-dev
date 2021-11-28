---
updated_at: 2021-11-27T14:56:29-05:00
---
# Algebraic data types

Unigraph schema supports [algebraic data types](https://en.wikipedia.org/wiki/Algebraic_data_type), which is a kind of complex typing system.

**Where to next?** check out the `entityUtils.ts` in the `unigraph-dev-common` package.

## Progress

Implemented: 
- Disjoint union (via `$/composer/Union`)
- Product types (native)

Not implemented:
- Dependent types

## Disjoint union

### Behavior
- Without specifications in the object, the schema checker would reject ambiguously-typed objects - that is, objects with more than one possible schema membership.
- 
### Example:
```json
{
    "type": { "unigraph.id": "$/composer/Array" },
    "parameters": {
        "element": {
            "type": { "unigraph.id": "$/composer/Union" },
            "parameters": {
                "definitions": [{
                    "type": { "unigraph.id": "$/schema/user" }
                }, {
                    "type": { "unigraph.id": "$/schema/customer" }
                }]
            }
        }
    }
}
```
### Union interface
Unigraph also supports union interfaces, a way of declaring compatible interfaces that altomatically connects to existing union interfaces.

To get your union recognized as a union interface, you need to:
- make the type of your schema `$/composer/Union`;
- start your type key with `interface/`.
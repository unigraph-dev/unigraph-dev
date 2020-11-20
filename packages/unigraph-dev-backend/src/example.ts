import Client from './dgraphClient';

async function main() {
  const client = new Client('localhost:9080');
  await client.dropAll();
  await client.setSchema(`
    name: string @index(term) .
    definition: [uid] .
    value: uid .
    predicate: string .
  `);

  /** TODO */
  type Entity = any;

  const todoModel: Entity = {
    uid: '_:models/todo',
    name: 'TODO Model',
    definition: [
      { name: 'Due Date' },
      {
        name: 'Owner',
        definition: [
          {
            uid: '_:property',
            definition: [{
              // is this how you create a type?
              'dgraph.type': '_:user'
            }]
          }
        ]
      }
    ],
    // neat: can define data not present in dgraph schema and it still works
    otherField: { notDefined: 'test' }
  };

  await client.createData(todoModel);
  const entities = await client.queryData<Entity[]>(`
      query findByName($a: string) {
        entities(func: eq(name, $a)) {
          uid
          name
          definition @filter(eq(name, "Owner")) {
            name
          }
          otherField {
            notDefined
          }
        }
      }
    `, {
    $a: todoModel.name
  });

  console.log(`Number of objects with name '${todoModel.name}': ${entities.length}`);
  entities.forEach(entity => console.log(entity));

  await client.dropData();
  client.close();
}

main();
const newTitles = (
    await unigraph.getQueries([
        `(func: uid(u1, u2, u3, u4, u5, u6)) @filter(NOT eq(_hide, true) AND type(Entity)) @normalize {
          uid
          _updatedAt: _updatedAt
          type { type: <unigraph.id> }
              <unigraph.indexes> {
                  name {
                      name: <_value.%>
                      _value { _value { name: <_value.%> } }
            }
          }
        }
        var(func: eq(<unigraph.id>, "$/schema/note_block")) {
          <~type> {
                  u1 as uid
            }
          }
        
        var(func: eq(<unigraph.id>, "$/schema/calendar_event")) {
          <~type> {
                  u2 as uid
            }
          }
        
        var(func: eq(<unigraph.id>, "$/schema/email_message")) {
          <~type> {
                  u3 as uid
            }
          }
        
        var(func: eq(<unigraph.id>, "$/schema/todo")) {
          <~type> {
                  u4 as uid
            }
          }
        
        var(func: eq(<unigraph.id>, "$/schema/contact")) {
          <~type> {
                  u5 as uid
            }
          }

        var(func: eq(<unigraph.id>, "$/schema/tag")) {
          <~type> {
                  u6 as uid
            }
          }`,
    ])
)[0];

unigraph.updateClientCache('searchTitles', newTitles);

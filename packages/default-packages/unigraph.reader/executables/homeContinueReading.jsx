const [totalItems, setTotalItems] = React.useState([]);
const [listUid, setListUid] = React.useState('');
const readLaterUid = window.unigraph.getNamespaceMap()['$/entity/read_later'].uid;

React.useEffect(() => {
    const id = getRandomInt();

    window.unigraph.subscribeToQuery(`(func: uid(uuu)) @recurse(depth: 15) {
        uid
        <unigraph.id>
        expand(_userpredicate_)
    }
    
    uuu as var(func: uid(uu)) @cascade {
        type @filter(eq(<unigraph.id>, "$/schema/incremental_reader_item"))
    }
      
    var(func: uid(${readLaterUid})) @cascade { _value { 
        children { <_value[> {
          _value {
                  _value {
                    uu as uid
                  }
          }
        } } } }`, (res) => {
            setTotalItems(res);
        }, id);

    window.unigraph.subscribeToQuery(`(func: uid(${readLaterUid})) {
        _value { children { uid } }
    }`, (res) => {
        setListUid(res[0]._value.children.uid)
    }, id+1);

    return function cleanup () {
        window.unigraph.unsubscribe(id);
        window.unigraph.unsubscribe(id+1);
    }
}, [])

return <div>
    {listUid.length ? <DynamicObjectListView 
        items={totalItems}
        context={null}
        listUid={listUid}
        noBar
        itemRemover={(uids) => {window.unigraph.deleteItemFromArray(listUid, uids, readLaterUid)}}
    /> : []}
</div>
const [totalItems, setTotalItems] = React.useState([]);
const [listUid, setListUid] = React.useState('');
const readLaterUid = window.unigraph.getNamespaceMap()['$/entity/read_later'].uid;

React.useEffect(() => {
    window.unigraph.getQueries([`(func: uid(uuu)) @recurse(depth: 15) {
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
        } } } }`, `(func: uid(${readLaterUid})) {
            _value { children { uid } }
        }`]).then((res) => {
            console.log(res);
            setTotalItems(res[0]);
            setListUid(res[1][0]._value.children.uid)
        });
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